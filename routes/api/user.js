const sendMail = require("../../methods/mailer").sendMail;
const SHA256 = require("crypto-js/sha256");
const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const error_messages = require("../../config/error_messages");
const standartSlugify = require("standard-slugify");
const authCheck = require("../../middlewares/authCheck");

const { NODE_ENV } = process.env;

const {
    LogAddUser,
    LogUpdateUser,
    LogDeleteUser,
} = require("../../methods/database_logs");
const JoiValidator = require("../../middlewares/validate");
const {
    UserLoginLimiter,
    UserRegisterLimiter,
    GeneralAPIRequestsLimiter,
} = require("../../middlewares/rate-limiter");

// Models
const {
    Sequelize,
    sequelize,
    User,
    PendingUser,
} = require("../../config/sequelize");
const {
    registerUserSchema,
    loginUserSchema,
} = require("../../validators/user");

// @route   GET api/kullanici/kayit
// @desc    Register user
// @access  Public
router.post(
    "/kayit",
    UserRegisterLimiter,
    JoiValidator(registerUserSchema),
    async (req, res) => {
        const { username, email, password } = req.body;

        let user_check, email_check;

        let errors = {};

        try {
            user_check = await User.findOne({
                where: { name: username },
                raw: true,
            });
            email_check = await User.findOne({
                where: { email: email },
                raw: true,
            });
        } catch (err) {
            console.log(err);
            return res
                .status(500)
                .json({ err: req.t("errors:database.cant_connect") });
        }

        if (user_check || email_check) {
            if (user_check)
                errors.username = req.t("errors:user.register.username_in_use");
            if (email_check)
                errors.email = req.t("errors:user.register.email_in_use");
            return res.status(400).json({
                err: errors,
            });
        } else {
            const avatar = gravatar.url(req.body.email, {
                s: "200", // Size
                r: "pg", // Rating
                d: "mm", // Default
            });

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password, salt, async (err, p_hash) => {
                    let user_result;
                    if (err) return console.log(err);

                    try {
                        user_result = await User.create({
                            slug: standartSlugify(username),
                            name: username,
                            email: email,
                            avatar,
                            password: p_hash,
                            activated: 0,
                        });
                    } catch (err) {
                        console.log(err);
                        return res.status(500).json({
                            err: req.t("errors:database.cant_connect"),
                        });
                    }
                    const c_hash = SHA256(
                        `${new Date().toString()} ${user_result.insertId}`
                    ).toString();

                    try {
                        await PendingUser.create({
                            user_id: user_result.id,
                            hash_key: c_hash,
                        });
                    } catch (err) {
                        console.log(err);
                        try {
                            await User.destroy({
                                where: { id: user_result.id },
                            });
                        } catch (err) {
                            console.log(err);
                        }
                        return res.status(500).json({
                            err: req.t("errors:database.cant_connect"),
                        });
                    }
                    const payload = {
                        to: email,
                        subject: req.t("mail:subject", {
                            SITE_NAME: process.env.SITE_NAME,
                        }),
                        text: "",
                        html: req.t("mail:template", {
                            SITE_NAME: process.env.SITE_NAME,
                            USERNAME: username,
                            HOST_URL: process.env.HOST_URL,
                            c_hash: c_hash,
                        }),
                    };
                    try {
                        await sendMail(payload);
                        res.status(200).json({ success: "success" });
                    } catch (err) {
                        console.log(err);
                        try {
                            await User.destroy({
                                where: { id: user_result.id },
                            });
                            await PendingUser.destroy({
                                where: { user_id: user_result.id },
                            });
                        } catch (err) {
                            console.log(err);
                        }
                        res.status(500).json({
                            err: req.t("errors:user.register.email_send_error"),
                        });
                    }
                });
            });
        }
    }
);

// @route   GET api/kullanici/kayit/admin
// @desc    Register user (perm: "add-user")
// @access  Private
router.post(
    "/kayit/admin",
    authCheck("add-user"),
    JoiValidator(registerUserSchema),
    async (req, res) => {
        const { username, email, password } = req.body;

        let user;

        try {
            user = await User.findOne({
                where: { email: email, name: username },
                raw: true,
            });
        } catch (err) {
            console.log(err);
            return res
                .status(500)
                .json({ err: req.t("errors:database.cant_connect") });
        }

        if (user) {
            return res.status(400).json({
                ...errors,
                err: req.t("errors:user.register.info_in_use"),
            });
        } else {
            const avatar = gravatar.url(req.body.email, {
                s: "200", // Size
                r: "pg", // Rating
                d: "mm", // Default
            });

            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password, salt, async (err, p_hash) => {
                    let result;
                    if (err) throw err;

                    try {
                        result = await User.create({
                            slug: standartSlugify(name),
                            name: username,
                            email: email,
                            avatar,
                            password: p_hash,
                            activated: 1,
                        });
                    } catch (err) {
                        console.log(err);
                        return res.status(500).json({
                            err: req.t("errors:database.cant_connect"),
                        });
                    }

                    LogAddUser({
                        process_type: "add-user",
                        username: req.authUser.name,
                        user_id: result.id,
                    });

                    return res.status(200).json({ success: "success" });
                });
            });
        }
    }
);

// @route   GET api/kullanici/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post(
    "/giris",
    UserLoginLimiter,
    JoiValidator(loginUserSchema),
    async (req, res) => {
        const { username, password } = req.body;
        let errors = {};
        // Find user by email
        try {
            user = await User.findOne({
                raw: true,
                where: { name: username },
                attributes: ["name", "password", "avatar", "activated", "id"],
            });
        } catch (err) {
            console.log(err);
        }

        // Check for user
        if (!user) {
            errors.username = req.t("errors:user.login.no_user");
            return res.status(404).json({
                ...errors,
            });
        }

        // Check Password
        bcrypt.compare(password, user.password).then((isMatch) => {
            if (isMatch) {
                if (!user.activated) {
                    return res.status(403).json({
                        ...errors,
                        err: req.t("errors:user.login.account_not_activated"),
                    });
                }
                // User Matched
                const payload = {
                    id: user.id,
                    username: user.name,
                    avatar: user.avatar,
                }; // Create JWT Payload
                // Sign Token
                jwt.sign(
                    payload,
                    keys.secretOrKey,
                    {
                        expiresIn: NODE_ENV === "development" ? "3650d" : "12h",
                    },
                    (err, token) => {
                        res.json({
                            success: true,
                            token,
                            username: user.name,
                            avatar: user.avatar,
                            exp:
                                NODE_ENV === "development"
                                    ? Date.now() + 315360000000
                                    : Date.now() + 43200000,
                        });
                    }
                );
            } else {
                errors.password = req.t("errors:user.login.wrong_password");
                return res.status(404).json({
                    ...errors,
                });
            }
        });
    }
);

// @route   POST api/kullanici/uye-guncelle
// @desc    Update user (perm: "update-user")
// @access  Private
router.post("/uye-guncelle", authCheck("update-user"), async (req, res) => {
    const { id, slug, name, password, permission_level, avatar } = req.body;

    try {
        await User.update(
            {
                slug,
                name,
                permission_level,
                avatar,
            },
            { where: { id: id } }
        );

        if (password) {
            User.update(
                { password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)) },
                { where: { id: id } }
            );
        }

        LogUpdateUser({
            process_type: "update-user",
            username: req.authUser.name,
            user_id: id,
        });

        return res.status(200).json({ success: "success" });
    } catch (err) {
        console.log(err);
        return res
            .status(500)
            .json({ err: req.t("errors:database.cant_connect") });
    }
});

// @route   GET api/kullanici/uye-sil
// @desc    Delete user (perm: "delete-user")
// @access  Private
router.post("/uye-sil", authCheck("delete-user"), async (req, res) => {
    let user;
    const user_id_body = req.body.user_id;

    try {
        user = await User.findOne({ raw: true, where: { id: user_id_body } });
    } catch (err) {
        console.log(err);
    }

    try {
        await User.destroy({ where: { id: user_id_body } });

        LogDeleteUser({
            process_type: "delete-user",
            username: req.authUser.name,
            name: user.name,
        });

        return res.status(200).json({ success: "success" });
    } catch (err) {
        return res
            .status(500)
            .json({ err: req.t("errors:database.cant_connect") });
    }
});

// @route   POST api/kullanici/kayit-tamamla
// @desc    Activate user on correct hash
// @access  Public
router.post("/kayit-tamamla", async (req, res) => {
    let { hash } = req.body;

    try {
        const pending_user = await PendingUser.findOne({
            raw: true,
            where: { hash_key: hash },
        });

        if (!pending_user.hash_key)
            return res
                .status(404)
                .json({ err: req.t("errors:user.login.no_user") });

        const { hash_key, user_id, created_time } = pending_user;

        if (new Date().valueOf() - 600000 > created_time.valueOf()) {
            return res.status(200).json({ success: "refresh" });
        }

        await User.update({ activated: 1 }, { where: { id: user_id } });
        await PendingUser.destroy({ where: { hash_key: hash_key } });

        return res.status(200).json({ success: "success" });
    } catch (err) {
        console.log(err);
        return res
            .status(500)
            .json({ err: req.t("errors:database.cant_connect") });
    }
});

// @route   POST api/kullanici/kayit-tamamla
// @desc    Refresh user hash with old hash
// @access  Public
router.post("/kayit-tamamla/yenile", async (req, res) => {
    let { old_hash } = req.body;

    try {
        const { hash_key, user_id, created_time, email, username } =
            await PendingUser.findOne({
                raw: true,
                where: { hash_key: old_hash },
                attributes: [
                    "*",
                    [
                        Sequelize.literal(
                            `(SELECT email FROM user WHERE id=pending_user.user_id)`
                        ),
                        "email",
                    ],
                    [
                        Sequelize.literal(
                            `(SELECT name FROM user WHERE id=pending_user.user_id)`
                        ),
                        "username",
                    ],
                ],
            });

        if (!user_id || !hash_key || !created_time) {
            return res
                .status(404)
                .json({ err: req.t("errors:user.login.no_user") });
        }

        const hash = SHA256(`${new Date().toString()} ${user_id}`).toString();

        await PendingUser.destroy({ where: { hash_key: hash_key } });

        await PendingUser.create({
            user_id: user_id,
            hash_key: hash,
        });

        await sendMail({
            to: email,
            subject: req.t("mail:subject", {
                SITE_NAME: process.env.SITE_NAME,
            }),
            text: "",
            html: req.t("mail:template", {
                SITE_NAME: process.env.SITE_NAME,
                USERNAME: username,
                HOST_URL: process.env.HOST_URL,
                c_hash: c_hash,
            }),
        });

        return res.status(200).json({ success: "success" });
    } catch (err) {
        console.log(err);
        return res
            .status(500)
            .json({ err: req.t("errors:database.cant_connect") });
    }
});

// @route   GET api/kullanici/adminpage
// @desc    Return to see if user can see the page or not (perm: "see-admin-page")
// @access  Private
router.get(
    "/adminpage",
    GeneralAPIRequestsLimiter,
    authCheck("see-admin-page"),
    async (req, res) => {
        let username, count;

        if (!req.query.withprops)
            return res.status(200).json({
                success: "success",
            });
        else {
            try {
                [count] = await sequelize.query(
                    `
            SELECT (SELECT COUNT(*) FROM anime) AS ANIME_COUNT,
            (SELECT COUNT(*) FROM manga) AS MANGA_COUNT,
            (SELECT COUNT(*) FROM episode) AS EPISODE_COUNT,
            (SELECT COUNT(*) FROM manga_episode) AS MANGA_EPISODE_COUNT,
            (SELECT COUNT(*) FROM download_link) AS DOWNLOADLINK_COUNT,
            (SELECT COUNT(*) FROM watch_link) AS WATCHLINK_COUNT,
            (SELECT COUNT(*) FROM user) AS USER_COUNT,
            (SELECT permission_set FROM permission WHERE slug=(SELECT permission_level FROM user WHERE name="${req.authUser.name}")) as PERMISSION_LIST,
            (SELECT name FROM permission WHERE slug=(SELECT permission_level FROM user WHERE name="${req.authUser.name}")) as PERMISSION_NAME`,
                    { type: Sequelize.QueryTypes.SELECT }
                );
            } catch (err) {
                console.log(err);
            }
            return res.status(200).json(count);
        }
    }
);

// @route   GET api/kullanici/uye-liste
// @desc    Get all users (perm: "see-user")
// @access  Private
router.get("/uye-liste", authCheck("see-user"), async (req, res) => {
    let users;

    try {
        users = await User.findAll({
            attributes: [
                "id",
                "slug",
                "name",
                "permission_level",
                "avatar",
                "email",
            ],
        });
        res.status(200).json(users);
    } catch (err) {
        console.log(err);
        res.status(500).json({ err: req.t("errors:database.cant_connect") });
    }
});

module.exports = router;

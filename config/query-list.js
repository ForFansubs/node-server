const animeinfoget = (animeid) => (
    `SELECT name, slug, synopsis, cover_art, id, (SELECT name FROM user WHERE id=anime.created_by) as created_by FROM anime WHERE id="${animeid}"`
)

const episodeinfoget = (animeid, episodeid) => (
    `SELECT *, (SELECT name FROM anime WHERE id="${animeid}") as anime_name, (SELECT cover_art FROM anime WHERE id="${animeid}") as cover_art, (SELECT name FROM user WHERE id=anime.created_by) as created_by FROM episode WHERE id="${episodeid}"`
)

const mangainfoget = (mangaid) => (
    `SELECT *, (SELECT name FROM user WHERE id=manga.created_by) as created_by FROM manga WHERE id="${mangaid}"`
)

module.exports = {
    animeinfoget,
    episodeinfoget,
    mangainfoget
}
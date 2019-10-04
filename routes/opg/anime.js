const express = require('express')
const router = express.Router()
const mariadb = require('../../config/maria')

router.get('/:slug', (req, res) => {
    mariadb.query(`SELECT name, slug, synopsis, cover_art, id, (SELECT name FROM user WHERE id=anime.created_by) as created_by FROM anime WHERE slug="${req.params.slug}"`)
        .then(anime => {
            //Eğer anime yoksa hata yolla.
            if (!anime[0]) {
                return res.status(404).send(`
                <html>
                    <head>
                        <title>${process.env.SITE_NAME}</title>
                    </head>
                    <body>
                    </body>
                    <script>
                        window.location.href= "${process.env.HOST_URL}/404"
                    </script>
                </html>`);
            } else {
                if (require('isbot')(req.headers['user-agent'])) {
                    res.status(200).send(`
                    <html>
                        <head>
                            <title>${process.env.SITE_NAME}</title>
                            <meta name="twitter:site" content="${process.env.HOST_URL}/ceviriler/anime/${anime[0].slug}" />
                            <meta name="twitter:creator" content="${anime[0].created_by}" />
                            <meta name="twitter:card" content="${anime[0].synopsis}" />
                            <meta name="twitter:title" content="${anime[0].name}" />
                            <meta name="twitter:description" content="${anime[0].synopsis}" />
                            <meta name="twitter:image" content="${anime[0].cover_art}" />
                            <meta property="og:type" content="website" />
                            <meta property="og:site_name" content="${process.env.SITE_NAME}" />
                            <meta property="og:url" content="${process.env.HOST_URL}/ceviriler/anime/${anime[0].slug}" />
                            <meta property="og:title" content="${anime[0].name}" />
                            <meta property="og:description" content="${anime[0].synopsis}" />
                            <meta property="og:image" content="${anime[0].cover_art}" />
                        </head>
                        <body>
                        </body>
                    </html>`);
                }
                else {
                    res.status(200).send(`
                    <html>
                        <head>
                            <title>${process.env.SITE_NAME}</title>
                            <meta name="twitter:site" content="${process.env.HOST_URL}/ceviriler/anime/${anime[0].slug}" />
                            <meta name="twitter:creator" content="${anime[0].created_by}" />
                            <meta name="twitter:card" content="${anime[0].synopsis}" />
                            <meta name="twitter:title" content="${anime[0].name}" />
                            <meta name="twitter:description" content="${anime[0].synopsis}" />
                            <meta name="twitter:image" content="${anime[0].cover_art}" />
                            <meta property="og:type" content="website" />
                            <meta property="og:site_name" content="${process.env.SITE_NAME}" />
                            <meta property="og:url" content="${process.env.HOST_URL}/ceviriler/anime/${anime[0].slug}" />
                            <meta property="og:title" content="${anime[0].name}" />
                            <meta property="og:description" content="${anime[0].synopsis}" />
                            <meta property="og:image" content="${anime[0].cover_art}" />
                        </head>
                        <body>
                        </body>
                        <script>
                            window.location.href = "${process.env.HOST_URL}/ceviriler/anime/${anime[0].slug}"
                        </script>
                    </html>`);
                }
            }
        })
        .catch(_ => res.status(404).send(`
        <html>
            <head>
                <title>${process.env.SITE_NAME}</title>
            </head>
            <body>
            </body>
            <script>
                window.location.href= "${process.env.HOST_URL}/404"
            </script>
        </html>`));
})

module.exports = router;
const express = require('express')
const router = express.Router()
const mariadb = require('../../config/maria')

router.get('/:slug', (req, res) => {
    mariadb.query(`SELECT name, slug, synopsis, cover_art, id, (SELECT name FROM user WHERE id=manga.created_by) as created_by FROM manga WHERE slug="${req.params.slug}"`)
        .then(manga => {
            //Eğer manga yoksa hata yolla.
            if (!manga[0]) {
                return res.status(404).send(`
                <html>
                    <head>
                        <title>PuzzleSubs</title>
                    </head>
                    <body>
                    </body>
                    <script>
                        window.location.href= "https://puzzlesubs.com/404"
                    </script>
                </html>`);
            } else {
                res.status(200).send(`
                <html>
                    <head>
                        <title>PuzzleSubs</title>
                        <meta name="twitter:site" content="https://puzzlesubs.com/ceviriler/manga/${manga[0].slug}" />
                        <meta name="twitter:creator" content="${manga[0].created_by}" />
                        <meta name="twitter:card" content="${manga[0].synopsis}" />
                        <meta name="twitter:title" content="${manga[0].name}" />
                        <meta name="twitter:description" content="${manga[0].synopsis}" />
                        <meta name="twitter:image" content="${manga[0].cover_art}" />
                        <meta property="og:type" content="website" />
                        <meta property="og:site_name" content="PuzzleSubs" />
                        <meta property="og:url" content="https://puzzlesubs.com/ceviriler/manga/${manga[0].slug}" />
                        <meta property="og:title" content="${manga[0].name}" />
                        <meta property="og:description" content="${manga[0].synopsis}" />
                        <meta property="og:image" content="${manga[0].cover_art}" />
                    </head>
                    <body>
                    </body>
                    <script>
                        window.location.href= "https://puzzlesubs.com/ceviriler/manga/${manga[0].slug}"
                    </script>
                </html>`);
            }
        })
        .catch(_ => res.status(404).send(`
        <html>
            <head>
                <title>PuzzleSubs</title>
            </head>
            <body>
            </body>
            <script>
                window.location.href= "https://puzzlesubs.com/404"
            </script>
        </html>`));
})

module.exports = router;
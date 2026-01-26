export default function handler(req, res) {
    const dbUrl = process.env.DATABASE_URL;
    res.status(200).json({
        node_env: process.env.NODE_ENV,
        has_db_url: !!dbUrl,
        db_url_prefix: dbUrl ? dbUrl.substring(0, 15) + '...' : 'MISSING',
        cwd: process.cwd()
    });
}

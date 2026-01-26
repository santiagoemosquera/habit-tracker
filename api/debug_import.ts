import { db } from '../src/db/index.js';

export default async function handler(req: any, res: any) {
    try {
        // Just check if db is defined, don't query yet
        const isDbDefined = !!db;
        return res.status(200).json({
            status: 'ok',
            message: 'Imported db successfully',
            isDbDefined
        });
    } catch (error: any) {
        return res.status(500).json({
            error: error.message,
            stack: error.stack,
            location: 'Top level import likely succeeded if we are here, but runtime failed'
        });
    }
}

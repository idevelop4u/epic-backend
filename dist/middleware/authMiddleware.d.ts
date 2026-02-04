import type { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: any;
}
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=authMiddleware.d.ts.map
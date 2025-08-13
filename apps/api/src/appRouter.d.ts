export declare const appRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: {
        user: any;
    };
    meta: object;
    errorShape: {
        message: string;
        code: import("@trpc/server").TRPC_ERROR_CODE_NUMBER;
        data: object;
    };
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    auth: import("@trpc/server").TRPCBuiltRouter<{
        ctx: {
            user: any;
        };
        meta: object;
        errorShape: {
            message: string;
            code: import("@trpc/server").TRPC_ERROR_CODE_NUMBER;
            data: object;
        };
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        login: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                username: string;
                organizationName: string;
                password: string;
            };
            output: import("@repo/types/trpc/response").Success<"VALID_ACCESS_CODE", {
                status: "VALID_ACCESS_CODE";
                userId: any;
            }> | import("@repo/types/trpc/response").Success<"SUCCESS", {
                status: "SUCCESS";
                token: any;
            }>;
            meta: object;
        }>;
        setPasswordWithCode: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                userId: string;
                newPassword: string;
                oneTimeAccessCode: string;
            };
            output: import("@repo/types/trpc/response").Success<"PASSWORD_SET", {
                status: "PASSWORD_SET";
                token: any;
            }>;
            meta: object;
        }>;
    }>>;
    superAdmin: import("@trpc/server").TRPCBuiltRouter<{
        ctx: {
            user: any;
        };
        meta: object;
        errorShape: {
            message: string;
            code: import("@trpc/server").TRPC_ERROR_CODE_NUMBER;
            data: object;
        };
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        listAdmins: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: import("@repo/types/trpc/response").Success<"SUCCESS", {
                status: "SUCCESS";
                admins: any;
            }>;
            meta: object;
        }>;
        createAdmin: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                username: string;
                email: string;
                organizationName: string;
            };
            output: import("@repo/types/trpc/response").Success<"ADMIN_CREATED", {
                status: "ADMIN_CREATED";
                userId: any;
                username: any;
                email: any;
                organizationName: string;
                oneTimeAccessCode: any;
                expiresAt: Date;
            }>;
            meta: object;
        }>;
    }>>;
}>>;
export type AppRouter = typeof appRouter;

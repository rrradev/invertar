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
            input: any;
            output: any;
            meta: object;
        }>;
        setPasswordWithCode: import("@trpc/server").TRPCMutationProcedure<{
            input: any;
            output: any;
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
            output: any;
            meta: object;
        }>;
        createAdmin: import("@trpc/server").TRPCMutationProcedure<{
            input: any;
            output: any;
            meta: object;
        }>;
    }>>;
}>>;
export type AppRouter = typeof appRouter;

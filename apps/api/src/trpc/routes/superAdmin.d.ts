export declare const superAdminRouter: import("@trpc/server").TRPCBuiltRouter<{
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

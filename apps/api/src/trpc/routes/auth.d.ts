export declare const authRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: {
        user: any;
    };
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    login: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            username: string;
            organizationName: string;
            password: string;
        };
        output: {
            status: string;
            userId: any;
            token?: undefined;
        } | {
            status: string;
            token: any;
            userId?: undefined;
        };
        meta: object;
    }>;
    setPasswordWithCode: import("@trpc/server").TRPCMutationProcedure<{
        input: {
            userId: string;
            newPassword: string;
            oneTimeAccessCode: string;
        };
        output: {
            status: string;
            token: any;
        };
        meta: object;
    }>;
}>>;

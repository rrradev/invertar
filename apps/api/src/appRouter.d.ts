export declare const appRouter: import("@trpc/server").TRPCBuiltRouter<{
    ctx: {
        user: any;
    };
    meta: object;
    errorShape: import("@trpc/server").TRPCDefaultErrorShape;
    transformer: false;
}, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
    auth: import("@trpc/server").TRPCBuiltRouter<{
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
    superAdmin: import("@trpc/server").TRPCBuiltRouter<{
        ctx: {
            user: any;
        };
        meta: object;
        errorShape: import("@trpc/server").TRPCDefaultErrorShape;
        transformer: false;
    }, import("@trpc/server").TRPCDecorateCreateRouterOptions<{
        listAdmins: import("@trpc/server").TRPCQueryProcedure<{
            input: void;
            output: {
                status: string;
                admins: import("@repo/types/users").Admin[];
            };
            meta: object;
        }>;
        createAdmin: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                username: string;
                email: string;
                organizationName: string;
            };
            output: {
                status: string;
                userId: any;
                username: any;
                email: any;
                organizationName: string;
                oneTimeAccessCode: any;
                expiresAt: Date;
            };
            meta: object;
        }>;
        deleteAdmin: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                adminId: string;
            };
            output: {
                status: string;
                message: string;
            };
            meta: object;
        }>;
        refreshOTAC: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                adminId: string;
            };
            output: {
                status: string;
                message: string;
                oneTimeAccessCode: any;
                expiresAt: string;
            };
            meta: object;
        }>;
        resetAdmin: import("@trpc/server").TRPCMutationProcedure<{
            input: {
                adminId: string;
            };
            output: {
                status: string;
                message: string;
                oneTimeAccessCode: any;
                expiresAt: string;
            };
            meta: object;
        }>;
    }>>;
}>>;
export type AppRouter = typeof appRouter;

import { Success } from "@repo/types/trpc/response";
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
        output: Success<"SUCCESS", {
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
        output: Success<"ADMIN_CREATED", {
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

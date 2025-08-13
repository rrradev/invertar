import { Success } from "@repo/types/trpc/response";
export declare const authRouter: import("@trpc/server").TRPCBuiltRouter<{
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
        output: Success<"VALID_ACCESS_CODE", {
            status: "VALID_ACCESS_CODE";
            userId: any;
        }> | Success<"SUCCESS", {
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
        output: Success<"PASSWORD_SET", {
            status: "PASSWORD_SET";
            token: any;
        }>;
        meta: object;
    }>;
}>>;

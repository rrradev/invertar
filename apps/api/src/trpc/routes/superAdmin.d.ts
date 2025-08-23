import { Admin } from "@repo/types/users";
export declare const superAdminRouter: import("@trpc/server").TRPCBuiltRouter<{
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
            admins: Admin[];
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

import { TRPCError, type TRPCErrorShape } from "@trpc/server";
export declare const t: import("@trpc/server").TRPCRootObject<{
    user: any;
}, object, {
    errorFormatter({ shape, error }: {
        shape: TRPCErrorShape;
        error: TRPCError;
    }): {
        message: string;
        code: import("@trpc/server").TRPC_ERROR_CODE_NUMBER;
        data: object;
    };
}, {
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
}>;
export declare const router: import("@trpc/server").TRPCRouterBuilder<{
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
}>;
export declare const publicProcedure: import("@trpc/server").TRPCProcedureBuilder<{
    user: any;
}, object, object, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
export declare const protectedProcedure: import("@trpc/server").TRPCProcedureBuilder<{
    user: any;
}, object, {}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
export declare const adminProcedure: import("@trpc/server").TRPCProcedureBuilder<{
    user: any;
}, object, {}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;
export declare const superAdminProcedure: import("@trpc/server").TRPCProcedureBuilder<{
    user: any;
}, object, {}, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, import("@trpc/server").TRPCUnsetMarker, false>;

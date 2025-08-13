import { SuccessStatus } from "./successStatus";
export declare class Success<TStatus extends SuccessStatus, TExtra extends Record<string, any> = {}> {
    status?: TStatus;
    constructor({ status, ...rest }: {
        status: TStatus;
    } & TExtra);
}
export type SuccessResponse<TExtra extends Record<string, any> = {}, TStatus extends SuccessStatus = SuccessStatus> = {
    status: TStatus;
} & TExtra;
export type ErrorResponse = {
    status: string;
    message: string;
    code: string;
};

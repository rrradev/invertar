import { SuccessStatus } from "./successStatus";

export class Success<
  TStatus extends SuccessStatus,
  TExtra extends Record<string, any> = {}
> {
  status?: TStatus;

  constructor({ status, ...rest }: { status: TStatus } & TExtra) {
    Object.assign(this, { status, ...rest });
  }
}

export type SuccessResponse<
  TStatus extends SuccessStatus,
  TExtra extends Record<string, any> = {}
> = { status: TStatus } & TExtra;
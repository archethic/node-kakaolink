/**
 * Created by archethic on 2021/08/18
 * Copyright (c) archethic.
 * This code is licensed under the MIT Licensing Principles.
 */

import { AuthStatusCode } from "./kakaolink-status";

export * from './kakaolink-status';
export * from './web-response';

type StatusCode = AuthStatusCode | number;

interface RootResponse {
    readonly success: boolean;
    readonly status: StatusCode;
}

interface ProcessFailed extends RootResponse {
    readonly success: false;
}

interface ProcessSuccessValid<T> extends RootResponse {
    readonly success: true;
    readonly result: T;
}

interface ProcessSuccessVoid extends RootResponse {
    readonly success: true;
}

export type ProcessResponse<T> = Promise<ProcessFailed | ( T extends undefined ? ProcessSuccessVoid : ProcessSuccessValid<T> )>;
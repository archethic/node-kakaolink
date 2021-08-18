/**
 * Created by archethic on 2021/08/18
 * Copyright (c) archethic.
 * This code is licensed under the MIT Licensing Principles.
 */

import { AuthStatusCode } from "./kakaolink-status";

export interface AuthenticateResponse {
    readonly status: AuthStatusCode,
    readonly message: string
}

export interface LoadRoomData {
    securityKey: string,
    chats: Array<{
        id: string,
        title: string,
        memberCount: number,
        profileImageURLs: string[]
    }>
}
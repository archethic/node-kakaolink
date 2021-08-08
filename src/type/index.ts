/**
 * Created by archethic on 2021/08/06
 */

import { CookieJar } from "tough-cookie";

interface KakaoLinkLoginFailed {
    readonly success: false,
    readonly status: number,
    readonly message: string
}

interface KakaoLinkLoginSuccess {
    readonly success: true,
    readonly status: number,
    readonly result: loginResult
}

export interface loginResult {
    readonly apiKey: string,
    readonly url: string,
    readonly cookieJar: CookieJar
}

export type LoginResult = KakaoLinkLoginSuccess | KakaoLinkLoginFailed;
export type AsyncLoginResult = Promise<LoginResult>

export interface authenticateResponse {
    status: number,
    message: string
}

interface KakaoLinkSendFailed {
    success: false,
    status?: number,
    message: string
}

interface KakaoLinkSendSuccess {
    success: true,
    status: number,
    result: Record<string, unknown>
}

export type SendResult = KakaoLinkSendSuccess | KakaoLinkSendFailed;
export type AsyncSendResult = Promise<SendResult>;

export interface KakaoLinkCustom {
    link_ver: '4.0' | string,
    template_id: number | string,
    template_args: Record<string, unknown>
}

export interface KakaoLinkDefault {
    template_object: {
        object_type: 'feed',
        content: {
            title?: string,
            description?: string,
            image_url?: string,
            link?: {
                web_url?: string,
                mobile_web_url?: string
            },
            android_execution_params?: string,
            ios_execution_params?: string
        },
        social?: {
            like_count?: number,
            comment_count?: number
        },
        button_title?: string,
        button?: Array<{
            titile?: string,
            link?: {
                web_url?: string,
                mobile_web_url?: string,
                android_execution_params?: string,
                ios_execution_params?: string
            }
        }>
    }
}

export type KakaoLinkParams = KakaoLinkCustom | KakaoLinkDefault

export interface LoadRoomData {
    securityKey: string,
    chats: Array<{
        id: string,
        title: string,
        memberCount: number,
        profileImageURLs: string[]
    }>
}
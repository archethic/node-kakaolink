/**
 * Created by archethic on 2021/08/18
 * Copyright (c) archethic.
 * This code is licensed under the MIT Licensing Principles.
 */

export interface KakaoLinkCustom {
    link_ver: '4.0' | string;
    template_id: number | string;
    template_args: Record<string, unknown>;
}

export interface KakaoLinkDefault {
    template_object: {
        object_type: 'feed' | 'commerce' | 'list' | 'location' | 'text',
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
        }>,
    },
}

export type KakaoLinkParams = KakaoLinkCustom | KakaoLinkDefault;
/**
 * Created by archethic on 2021/08/07
 */

import axios, { AxiosError, AxiosResponse } from 'axios'
import axiosCookieJarSupport from 'axios-cookiejar-support'
import { load } from 'cheerio'
import { CookieJar } from 'tough-cookie'
import { loginResult } from '../api'
import { LinkConfig } from '../config'
import { KakaoLinkParams } from '../kakaolink/custom'
import { ProcessResponse } from '../request'

axiosCookieJarSupport(axios)

export interface KakaoLinkInfo {
    readonly appKey: string;
    readonly templateId: number;
    readonly templateArgs: Record<string, unknown>;
    readonly talkLinkPreview: Record<string, unknown>;
}

export class KakaoLinkClient {
    #cookieJar?: CookieJar
    #apiKey: string = '';
    #url: string = '';
    constructor() {
        
    }

    async login(loginRes: loginResult) {
        this.#cookieJar = loginRes.cookieJar;
        this.#apiKey = loginRes.apiKey;
        this.#url = loginRes.url;
    }

    async sendLink(roomName: string, params: KakaoLinkParams, type?: 'custom' | 'default'): ProcessResponse<KakaoLinkInfo> {
        const getLinkRes = await axios({
            method: 'POST',
            url: LinkConfig.getLoginUrl,
            data: {
                app_key: this.#apiKey,
                validation_action: type || 'custom',
                validation_params: JSON.stringify(params),
                ka: `sdk/1.25.7 os/javascript lang/ko-kr device/MacIntel origin/${encodeURIComponent(this.#url || 'https://developers.kakao.com')}`
            },
            jar: this.#cookieJar,
            withCredentials: true
        }).then((res:AxiosResponse<string>) => res).catch((err:AxiosError) => err.response);
        
        if(getLinkRes!.status !== 200) {
            return {
                success: false,
                status: getLinkRes!.status,
            }
        }

        const $ = load(getLinkRes!.data);
        const LinkParams = $('#validatedTalkLink').attr('value');
        const csrfToken = $('div').last().attr('ng-init')?.slice(7).replace("'", '');
        const roomData: AxiosResponse<LoadRoomData> | undefined = await axios({
            method: 'GET',
            url: LinkConfig.getChatData,
            headers: {
                Referer: LinkConfig.getLoginUrl,
                'Csrf-Token': csrfToken,
                'App-Key': this.#apiKey
            },
            responseType: 'json',
            jar: this.#cookieJar,
            withCredentials: true
        }).then((res) => res).catch((err:AxiosError) => err.response);

        let id, count = null;

        roomData?.data['chats'].map(e => {
            if(e.title === roomName) {
                id = e.id;
                count = e.memberCount;
                return;
            }
        });

        if(id === null || count === null) {
            return {
                success: false,
                status: -250,
            }
        }
        
        const sendLinkRes = await axios({
            method: 'POST',
            url: LinkConfig.sendLinkUrl,
            headers: {
                Referer: LinkConfig.getLoginUrl,
                'App-Key': this.#apiKey,
                'Csrf-Token': csrfToken,
                'Content-Type': 'application/json;charset=UTF-8'
            },
            data: JSON.stringify({
                validatedTalkLink: JSON.parse(LinkParams!),
                securityKey: roomData?.data['securityKey'],
                receiverType: 'chat',
                receiverIds: [id],
                receiverChatRoomMemberCount: [count]
            }),
            jar: this.#cookieJar,
            withCredentials: true
        }).then((res) => res).catch((err:AxiosError) => err.response);
        
        if(sendLinkRes!.status !== 200) {
            return {
                success: false,
                status: sendLinkRes!.status,
            }
        }

        return {
            success: true,
            status: sendLinkRes!.status,
            result: JSON.parse(LinkParams!)
        }
    }
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
/**
 * Created by archethic on 2021/08/07
 */

import axios, { AxiosError, AxiosResponse } from 'axios'
import axiosCookieJarSupport from 'axios-cookiejar-support'
import { load } from 'cheerio'
import { CookieJar } from 'tough-cookie'
import { LinkConfig } from '../config'
import { AsyncSendResult, KakaoLinkCustom, KakaoLinkDefault, KakaoLinkParams, LoadRoomData, loginResult } from '../type'

axiosCookieJarSupport(axios)

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

    async sendLink(roomName: string, params: KakaoLinkParams, type?: 'custom' | 'default'): AsyncSendResult {
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
        }).then((res:AxiosResponse) => res).catch((err:AxiosError) => err.response);
        
        if(getLinkRes?.status !== 200) {
            return {
                success: false,
                status: getLinkRes?.status,
                message: 'While preparing to send Kakao Link, an unknown error occurred. Please refer to error.md by referring to the status code.'
            }
        }

        const $ = load(getLinkRes.data);
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
                message: 'No room to send Kakao Link was found. Please check the room again'
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
        
        if(sendLinkRes?.status !== 200) {
            return {
                success: false,
                status: sendLinkRes?.status,
                message: 'An error occurred while sending Kakao Link. Please refer to error.md with status code'
            }
        }

        return {
            success: true,
            status: sendLinkRes.status,
            result: JSON.parse(LinkParams!)
        }
    }
}
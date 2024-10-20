import {JiraIssueAuthor, JiraIssueHistoryItem} from "./JiraTypes.ts";
import {SeriesOption} from "echarts";

export interface JiraFieldInfoHistory {
    time: number
    author: JiraIssueAuthor
    item: JiraIssueHistoryItem
}

export interface JiraFieldInfo {
    name: string
    type: string
    custom: string
    items: string
    system: string
    combinedType: string
    history: JiraFieldInfoHistory[]
}

export type JiraFieldsInfo = { [name: string]: JiraFieldInfo };

export type TransformFunction = {
    (field: JiraFieldInfo, category: string[], maxTime: number, createdTime: number): SeriesOption[]
};

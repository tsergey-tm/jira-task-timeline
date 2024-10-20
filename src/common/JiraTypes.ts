export interface JiraIssueInfo {
    expand: string
    id: string
    self: string
    key: string
    fields: JiraIssueFields
    changelog: JiraIssueChangelog
}

export interface JiraIssueFields {
    summary: string,
    created: string
}

export interface JiraIssueChangelog {
    startAt: number
    maxResults: number
    total: number
    histories: JiraIssueHistory[]
}

export interface JiraIssueHistory {
    id: string
    author: JiraIssueAuthor
    created: string
    items: JiraIssueHistoryItem[]
}

export interface JiraIssueAuthor {
    self: string
    name: string
    key: string
    emailAddress: string
    displayName: string
    active: boolean
    timeZone: string
}

export interface JiraIssueHistoryItem {
    field: string
    fieldtype: string
    from: string | null | undefined
    fromString: string | null | undefined
    to: string | null | undefined
    toString: string | null | undefined
}

export type JiraFields = JiraField[]

export interface JiraField {
    id: string
    name: string
    custom: boolean
    orderable: boolean
    navigable: boolean
    searchable: boolean
    clauseNames: string[]
    schema: JiraFieldSchema | null | undefined
}

export interface JiraFieldSchema {
    type: string
    custom: string | null | undefined
    customId: number | null | undefined
    items: string | null | undefined
    system: string | null | undefined
}

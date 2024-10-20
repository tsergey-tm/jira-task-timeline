import {JiraIssueHistoryItem} from "../../common/JiraTypes.ts";
import {Action, ActionRecord, ChecklistData, parseCheckList, parseJiraChangeLogItem} from "./ChecklistParser.ts";
import {JiraFieldInfo} from "../../common/Types.ts";

type parseJiraChangeLogItemTestDataType = {
    changelogItem: JiraIssueHistoryItem,
    expected: ActionRecord[]
}

const parseJiraChangeLogItemTestData: parseJiraChangeLogItemTestDataType[] =
    [
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "1) [Added] dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj\r\n2) [Added] fggdgbggf fgdn\n yhftyftyj fytjn\nD tydfyt"
            }, expected: [
                {
                    actions: [Action.Added],
                    from: "",
                    to: "dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                    fromState: []
                },
                {
                    actions: [Action.Added],
                    from: "",
                    to: "fggdgbggf fgdn\n yhftyftyj fytjn\nD tydfyt",
                    fromState: []
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj\r\n2) fggdgbggf fgdn\n yhftyftyj fytjn\nD tydfyt",
                "to": null,
                "toString": "1) [Status changed] (In Progress) dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj\r\n2) [H] fggdgbggf fgdn\n yhftyftyj fytjn\nD tydfyt\r\n3) [Added] dgdfgdfg\r\n4) [Added] [H] fthfthftht\r\n5) [Added] rtyrtyrtyr"
            }, expected: [
                {
                    actions: [Action.Modified],
                    from: "dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                    to: "(In Progress) dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                    fromState: []
                },
                {
                    actions: [Action.Removed],
                    from: "fggdgbggf fgdn\n yhftyftyj fytjn\nD tydfyt",
                    to: "",
                    fromState: []
                },
                {
                    actions: [Action.Added],
                    from: "",
                    to: "dgdfgdfg",
                    fromState: []
                },
                {
                    actions: [Action.Added],
                    from: "",
                    to: "rtyrtyrtyr",
                    fromState: []
                },

            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "No changes but items were reordered"
            }, expected: []
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) (In Progress) dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                "to": null,
                "toString": "1) [Status changed] dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj"
            }, expected: [
                {
                    actions: [Action.Modified],
                    from: "(In Progress) dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                    to: "dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                    fromState: []
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] rtyrtyrtyr\r\n2) [Unchecked] dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                "to": null,
                "toString": "1) [Checked] rtyrtyrtyr\r\n2) [Checked] dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj"
            }, expected: [
                {
                    actions: [Action.Checked],
                    from: "rtyrtyrtyr",
                    to: "rtyrtyrtyr",
                    fromState: [Action.Unchecked]
                },
                {
                    actions: [Action.Checked],
                    from: "dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                    to: "dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                    fromState: [Action.Unchecked]
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Mandatory] dgdfgdfg",
                "to": null,
                "toString": "1) [Optional] dgdfgdfg"
            }, expected: []
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) dgdfgdfg",
                "to": null,
                "toString": "1) [Modified] dgdfgdfg\n>>\nhukhjkghik kbhikhuilhuil"
            }, expected: [
                {
                    actions: [Action.Modified],
                    from: "dgdfgdfg",
                    to: "dgdfgdfg\n>>\nhukhjkghik kbhikhuilhuil",
                    fromState: []
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) dgdfgdfg\n>>\nhukhjkghik kbhikhuilhuil",
                "to": null,
                "toString": "1) [Modified] dgdfgdfg @usr2683\n>>\nhukhjkghik kbhikhuilhuil"
            }, expected: [
                {
                    actions: [Action.Modified],
                    from: "dgdfgdfg\n>>\nhukhjkghik kbhikhuilhuil",
                    to: "dgdfgdfg @usr2683\n>>\nhukhjkghik kbhikhuilhuil",
                    fromState: []
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Optional] dgdfgdfg @usr2683\n>>\nhukhjkghik kbhikhuilhuil",
                "to": null,
                "toString": "1) [Mandatory] dgdfgdfg @usr2683\n>>\nhukhjkghik kbhikhuilhuil"
            }, expected: []
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) dgdfgdfg @usr2683\n>>\nhukhjkghik kbhikhuilhuil",
                "to": null,
                "toString": "1) [H] dgdfgdfg @usr2683\n>>\nhukhjkghik kbhikhuilhuil"
            }, expected: [
                {
                    actions: [Action.Removed],
                    from: "dgdfgdfg @usr2683\n>>\nhukhjkghik kbhikhuilhuil",
                    to: "",
                    fromState: []
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] [H] fggdgbggf fgdn\n yhftyftyj fytjn\nD tydfyt\r\n2) [Unchecked] [H] dgdfgdfg @usr2683\n>>\nhukhjkghik kbhikhuilhuil\r\n3) [Unchecked] [H] fthfthftht\r\n4) [Checked] rtyrtyrtyr\r\n5) [Checked] dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                "to": null,
                "toString": "All items removed"
            }, expected: [
                {
                    actions: [Action.Removed],
                    from: "rtyrtyrtyr",
                    to: "",
                    fromState: [Action.Checked]
                },
                {
                    actions: [Action.Removed],
                    from: "dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                    to: "",
                    fromState: [Action.Checked]
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "1) [Added] смисапип апс аар {2024-10-31 00:00 +0500} (usr2683)"
            }, expected: [
                {
                    actions: [Action.Added],
                    from: "",
                    to: "смисапип апс аар {2024-10-31 00:00 +0500} (usr2683)",
                    fromState: []
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] смисапип апс аар {2024-10-31 00:00 +0500} (usr2683)",
                "to": null,
                "toString": "1) [Checked] смисапип апс аар {2024-10-31 00:00 +0500} (usr2683)"
            }, expected: [
                {
                    actions: [Action.Checked],
                    from: "смисапип апс аар {2024-10-31 00:00 +0500} (usr2683)",
                    to: "смисапип апс аар {2024-10-31 00:00 +0500} (usr2683)",
                    fromState: [Action.Unchecked]
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Checked] смисапип апс аар {2024-10-31 00:00 +0500} (usr2683)",
                "to": null,
                "toString": "All items removed"
            }, expected: [
                {
                    actions: [Action.Removed],
                    from: "смисапип апс аар {2024-10-31 00:00 +0500} (usr2683)",
                    to: "",
                    fromState: [Action.Checked]
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "1) [Added] [H] dgdfgdfg"
            }, expected: []
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [H] dgdfgdfg",
                "to": null,
                "toString": "1) [Modified] [H] dgdfgdfg"
            }, expected: []
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "1) [Added] [H] fgdfgdfvdfgthtgh"
            }, expected: []
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [H] fgdfgdfvdfgthtgh",
                "to": null,
                "toString": "1) [Modified] [H] fgdfgdfvdfgthtgh cgbfg"
            }, expected: []
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [H] fgdfgdfvdfgthtgh cgbfg",
                "to": null,
                "toString": "1) fgdfgdfvdfgthtgh cgbfg"
            }, expected: [
                {
                    actions: [Action.Added],
                    from: "",
                    to: "fgdfgdfvdfgthtgh cgbfg",
                    fromState: []
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) fgdfgdfvdfgthtgh cgbfg",
                "to": null,
                "toString": "1) [Modified] [H] fgdfgdfvdfgthtgh cgbfg"
            }, expected: [
                {
                    actions: [Action.Removed],
                    from: "fgdfgdfvdfgthtgh cgbfg",
                    to: "",
                    fromState: []
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] [H] fgdfgdfvdfgthtgh cgbfg",
                "to": null,
                "toString": "1) [Removed] "
            }, expected: []
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] [H] dgdfgdfg",
                "to": null,
                "toString": "1) [Checked] dgdfgdfg"
            }, expected: [
                {
                    actions: [Action.Added, Action.Checked],
                    from: "",
                    to: "dgdfgdfg",
                    fromState: [Action.Unchecked]
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Checked] dgdfgdfg",
                "to": null,
                "toString": "1) [Unchecked] [H] dgdfgdfg"
            }, expected: [
                {
                    actions: [Action.Removed],
                    from: "dgdfgdfg",
                    to: "",
                    fromState: [Action.Checked]
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [H] dgdfgdfg",
                "to": null,
                "toString": "1) dgdfgdfg"
            }, expected: [
                {
                    actions: [Action.Added],
                    from: "",
                    to: "dgdfgdfg",
                    fromState: []
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked, Mandatory] dgdfgdfg",
                "to": null,
                "toString": "1) [Checked, Optional] dgdfgdfg"
            }, expected: [
                {
                    actions: [Action.Checked],
                    from: "dgdfgdfg",
                    to: "dgdfgdfg",
                    fromState: [Action.Unchecked]
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Checked, Optional] dgdfgdfg",
                "to": null,
                "toString": "1) [Unchecked, Mandatory] dgdfgdfg"
            }, expected: [
                {
                    actions: [Action.Unchecked],
                    from: "dgdfgdfg",
                    to: "dgdfgdfg",
                    fromState: [Action.Checked]
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked, Mandatory] dgdfgdfg",
                "to": null,
                "toString": "1) [Modified, Checked, Optional] dgdfgdfg fghdfhdty"
            }, expected: [
                {
                    actions: [Action.Checked, Action.Modified],
                    from: "dgdfgdfg",
                    to: "dgdfgdfg fghdfhdty",
                    fromState: [Action.Unchecked]
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "1) [Added] fgbdnfgl;kbnd;fbnd"
            }, expected: [
                {
                    actions: [Action.Added],
                    from: "",
                    to: "fgbdnfgl;kbnd;fbnd",
                    fromState: []
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "No changes but items were reordered"
            }, expected: []
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] fgbdnfgl;kbnd;fbnd\r\n2) [Checked] dgdfgdfg fghdfhdty",
                "to": null,
                "toString": "All items removed"
            }, expected: [
                {
                    actions: [Action.Removed],
                    from: "fgbdnfgl;kbnd;fbnd",
                    to: "",
                    fromState: [Action.Unchecked]
                },
                {
                    actions: [Action.Removed],
                    from: "dgdfgdfg fghdfhdty",
                    to: "",
                    fromState: [Action.Checked]
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "1) [Added] qwerty"
            }, expected: [
                {
                    actions: [Action.Added],
                    from: "",
                    to: "qwerty",
                    fromState: []
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] qwerty",
                "to": null,
                "toString": "1) [Checked] qwerty\r\n2) [Added] asdfg\r\n3) [Added] zxcvb"
            }, expected: [
                {
                    actions: [Action.Checked],
                    from: "qwerty",
                    to: "qwerty",
                    fromState: [Action.Unchecked]
                },
                {
                    actions: [Action.Added],
                    from: "",
                    to: "asdfg",
                    fromState: []
                },
                {
                    actions: [Action.Added],
                    from: "",
                    to: "zxcvb",
                    fromState: []
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] asdfg\r\n2) [Checked] qwerty\r\n3) [Unchecked] zxcvb",
                "to": null,
                "toString": "All items removed"
            }, expected: [
                {
                    actions: [Action.Removed],
                    from: "asdfg",
                    to: "",
                    fromState: [Action.Unchecked]
                },
                {
                    actions: [Action.Removed],
                    from: "qwerty",
                    to: "",
                    fromState: [Action.Checked]
                },
                {
                    actions: [Action.Removed],
                    from: "zxcvb",
                    to: "",
                    fromState: [Action.Unchecked]
                }
            ]
        },
        {
            changelogItem: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] qazwsxedc\r\n2) [Checked] zaqxswcde\r\n3) [Unchecked] [H] ewqdsacxz",
                "to": null,
                "toString": "All items removed"
            }, expected: [
                {
                    actions: [Action.Removed],
                    from: "asdfg",
                    to: "",
                    fromState: [Action.Unchecked]
                },
                {
                    actions: [Action.Removed],
                    from: "qwerty",
                    to: "",
                    fromState: [Action.Checked]
                }
            ]
        },
    ]

test.each<parseJiraChangeLogItemTestDataType>(parseJiraChangeLogItemTestData)
(`Check parseJiraChangeLogItem: from $changelogItem.fromString to $changelogItem.toString`,
    (testData) => {
        expect(parseJiraChangeLogItem(testData.changelogItem)).toEqual(testData.expected)
    }
)

const field: JiraFieldInfo = {
    name: "Block list",
    type: "array",
    items: "checklist-item",
    custom: "com.okapya.jira.checklist:checklist",
    system: "",
    combinedType: "array:com.okapya.jira.checklist:checklist:checklist-item",
    history: [
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729682792000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "1) [Added] dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj\r\n2) [Added] fggdgbggf fgdn\n yhftyftyj fytjn\nD tydfyt"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729682876000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj\r\n2) fggdgbggf fgdn\n yhftyftyj fytjn\nD tydfyt",
                "to": null,
                "toString": "1) [Status changed] (In Progress) dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj\r\n2) [H] fggdgbggf fgdn\n yhftyftyj fytjn\nD tydfyt\r\n3) [Added] dgdfgdfg\r\n4) [Added] [H] fthfthftht\r\n5) [Added] rtyrtyrtyr"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729682894000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "No changes but items were reordered"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729682911000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) (In Progress) dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                "to": null,
                "toString": "1) [Status changed] dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729682921000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] rtyrtyrtyr\r\n2) [Unchecked] dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                "to": null,
                "toString": "1) [Checked] rtyrtyrtyr\r\n2) [Checked] dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729683022000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Mandatory] dgdfgdfg",
                "to": null,
                "toString": "1) [Optional] dgdfgdfg"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729683039000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) dgdfgdfg",
                "to": null,
                "toString": "1) [Modified] dgdfgdfg\n>>\nhukhjkghik kbhikhuilhuil"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729683074000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) dgdfgdfg\n>>\nhukhjkghik kbhikhuilhuil",
                "to": null,
                "toString": "1) [Modified] dgdfgdfg @\n>>\nhukhjkghik kbhikhuilhuil"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729683100000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Optional] dgdfgdfg @\n>>\nhukhjkghik kbhikhuilhuil",
                "to": null,
                "toString": "1) [Mandatory] dgdfgdfg @\n>>\nhukhjkghik kbhikhuilhuil"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729683119000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) dgdfgdfg @\n>>\nhukhjkghik kbhikhuilhuil",
                "to": null,
                "toString": "1) [H] dgdfgdfg @\n>>\nhukhjkghik kbhikhuilhuil"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729683133000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] [H] fggdgbggf fgdn\n yhftyftyj fytjn\nD tydfyt\r\n2) [Unchecked] [H] dgdfgdfg @\n>>\nhukhjkghik kbhikhuilhuil\r\n3) [Unchecked] [H] fthfthftht\r\n4) [Checked] rtyrtyrtyr\r\n5) [Checked] dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                "to": null,
                "toString": "All items removed"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729684218000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "1) [Added] смисапип апс аар {2024-10-31 00:00 +0500} (qwe)"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729684227000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] смисапип апс аар {2024-10-31 00:00 +0500} (qwe)",
                "to": null,
                "toString": "1) [Checked] смисапип апс аар {2024-10-31 00:00 +0500} (qwe)"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729684235000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Checked] смисапип апс аар {2024-10-31 00:00 +0500} (qwe)",
                "to": null,
                "toString": "All items removed"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729749696000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "1) [Added] [H] dgdfgdfg"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729749808000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [H] dgdfgdfg",
                "to": null,
                "toString": "1) [Modified] [H] dgdfgdfg"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729750007000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "1) [Added] [H] fgdfgdfvdfgthtgh"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729750091000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [H] fgdfgdfvdfgthtgh",
                "to": null,
                "toString": "1) [Modified] [H] fgdfgdfvdfgthtgh cgbfg"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729750147000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [H] fgdfgdfvdfgthtgh cgbfg",
                "to": null,
                "toString": "1) fgdfgdfvdfgthtgh cgbfg"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729750176000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) fgdfgdfvdfgthtgh cgbfg",
                "to": null,
                "toString": "1) [Modified] [H] fgdfgdfvdfgthtgh cgbfg"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729755608000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] [H] fgdfgdfvdfgthtgh cgbfg",
                "to": null,
                "toString": "1) [Removed] "
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729755619000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] [H] dgdfgdfg",
                "to": null,
                "toString": "1) [Checked] dgdfgdfg"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729755676000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Checked] dgdfgdfg",
                "to": null,
                "toString": "1) [Unchecked] [H] dgdfgdfg"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729764666000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [H] dgdfgdfg",
                "to": null,
                "toString": "1) dgdfgdfg"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729764719000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked, Mandatory] dgdfgdfg",
                "to": null,
                "toString": "1) [Checked, Optional] dgdfgdfg"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729764758000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Checked, Optional] dgdfgdfg",
                "to": null,
                "toString": "1) [Unchecked, Mandatory] dgdfgdfg"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729764772000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked, Mandatory] dgdfgdfg",
                "to": null,
                "toString": "1) [Modified, Checked, Optional] dgdfgdfg fghdfhdty"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729825698000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "1) [Added] fgbdnfgl;kbnd;fbnd"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729825708000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "No changes but items were reordered"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1729845093000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] fgbdnfgl;kbnd;fbnd\r\n2) [Checked] dgdfgdfg fghdfhdty",
                "to": null,
                "toString": "All items removed"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1730186798000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "1) [Added] qwerty"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1730186826000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] qwerty",
                "to": null,
                "toString": "1) [Checked] qwerty\r\n2) [Added] asdfg\r\n3) [Added] zxcvb"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1730186839000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked] asdfg\r\n2) [Checked] qwerty\r\n3) [Unchecked] zxcvb",
                "to": null,
                "toString": "All items removed"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1830186839000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Unchecked, Mandatory] ewqdsacxz\r\n2) [H] qazwsxedc\r\n3) cxzdsaewq\r\n4) poilkjmnb\r\n5) rfvtgbyhn\r\n6) wsxedcrfv",
                "to": null,
                "toString": "1) [Modified, Checked, Optional] ewqdsacxz1\r\n2) [Modified] [H] qazwsxedc1\r\n3) [Modified] cxzdsaewq1\r\n4) [Modified] poilkjmnb1\r\n5) [Modified] rfvtgbyhn1\r\n6) [Modified] wsxedcrfv1"
            }
        },
        {
            author: {
                "self": "",
                "name": "",
                "key": "",
                "emailAddress": "",
                "displayName": "",
                "active": true,
                "timeZone": "Asia/Yekaterinburg"
            },
            time: 1930186839000,
            item: {
                "field": "Block list",
                "fieldtype": "custom",
                "from": null,
                "fromString": "1) [Checked, Optional] ewqdsacxz1\r\n2) [H] qazwsxedc1\r\n3) [Unchecked] cxzdsaewq1\r\n4) [Checked] poilkjmnb1\r\n5) [Unchecked] rfvtgbyhn1\r\n6) [Checked] wsxedcrfv1",
                "to": null,
                "toString": "1) [Removed] \r\n2) [Removed] \r\n3) [Removed] \r\n4) [Removed] \r\n5) [Checked] rfvtgbyhn1\r\n6) [Unchecked] wsxedcrfv1"
            }
        }
    ]
}

const parsedChecklist: ChecklistData[] = [
    {
        category: "Block list: dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
        data: [
            {
                time: 1729682792000,
                value: "dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                checked: false,
                removed: false
            },
            {
                time: 1729682876000,
                value: "(In Progress) dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                checked: false,
                removed: false
            },
            {
                time: 1729682911000,
                value: "dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                checked: false,
                removed: false
            },
            {
                time: 1729682921000,
                value: "dfgdfgfdbgb\nFgdthfyhyh\nGHngjnj",
                checked: true,
                removed: false
            },
            {
                time: 1729683133000,
                value: "",
                checked: false,
                removed: true
            }
        ]
    },
    {
        category: "Block list: fggdgbggf fgdn\n yhftyftyj fytjn\nD tydfyt",
        data: [
            {
                time: 1729682792000,
                value: "fggdgbggf fgdn\n yhftyftyj fytjn\nD tydfyt",
                checked: false,
                removed: false
            },
            {
                time: 1729682876000,
                value: "",
                checked: false,
                removed: true
            }
        ]
    },
    {
        category: "Block list: dgdfgdfg @\n>>\nhukhjkghik kbhikhuilhuil",
        data: [
            {
                time: 1729682876000,
                value: "dgdfgdfg",
                checked: false,
                removed: false
            },
            {
                time: 1729683039000,
                value: "dgdfgdfg\n>>\nhukhjkghik kbhikhuilhuil",
                checked: false,
                removed: false
            },
            {
                time: 1729683074000,
                value: "dgdfgdfg @\n>>\nhukhjkghik kbhikhuilhuil",
                checked: false,
                removed: false
            },
            {
                time: 1729683119000,
                value: "",
                checked: false,
                removed: true
            }
        ]
    },
    {
        category: "Block list: rtyrtyrtyr",
        data: [
            {
                time: 1729682876000,
                value: "rtyrtyrtyr",
                checked: false,
                removed: false
            },
            {
                time: 1729682921000,
                value: "rtyrtyrtyr",
                checked: true,
                removed: false
            },
            {
                time: 1729683133000,
                value: "",
                checked: false,
                removed: true
            }
        ]
    },
    {
        "category": "Block list: смисапип апс аар {2024-10-31 00:00 +0500} (qwe)",
        "data": [
            {
                "checked": false,
                "removed": false,
                "time": 1729684218000,
                "value": "смисапип апс аар {2024-10-31 00:00 +0500} (qwe)",
            },
            {
                "checked": true,
                "removed": false,
                "time": 1729684227000,
                "value": "смисапип апс аар {2024-10-31 00:00 +0500} (qwe)",
            },
            {
                "checked": false,
                "removed": true,
                "time": 1729684235000,
                "value": "",
            }
        ]
    },
    {
        "category": "Block list: fgdfgdfvdfgthtgh cgbfg",
        "data": [
            {
                "checked": false,
                "removed": false,
                "time": 1729750147000,
                "value": "fgdfgdfvdfgthtgh cgbfg"
            },
            {
                "checked": false,
                "removed": true,
                "time": 1729750176000,
                "value": ""
            }
        ]
    },
    {
        "category": "Block list: dgdfgdfg fghdfhdty",
        "data": [
            {
                "checked": true,
                "removed": false,
                "time": 1729755619000,
                "value": "dgdfgdfg"
            },
            {
                "checked": false,
                "removed": true,
                "time": 1729755676000,
                "value": ""
            },
            {
                "checked": false,
                "removed": false,
                "time": 1729764666000,
                "value": "dgdfgdfg"
            },
            {
                "checked": true,
                "removed": false,
                "time": 1729764719000,
                "value": "dgdfgdfg"
            },
            {
                "checked": false,
                "removed": false,
                "time": 1729764758000,
                "value": "dgdfgdfg"
            },
            {
                "checked": true,
                "removed": false,
                "time": 1729764772000,
                "value": "dgdfgdfg fghdfhdty"
            },
            {
                "checked": false,
                "removed": true,
                "time": 1729845093000,
                "value": ""
            }
        ]
    },
    {
        "category": "Block list: fgbdnfgl;kbnd;fbnd",
        "data": [
            {
                "checked": false,
                "removed": false,
                "time": 1729825698000,
                "value": "fgbdnfgl;kbnd;fbnd"
            },
            {
                "checked": false,
                "removed": true,
                "time": 1729845093000,
                "value": ""
            }
        ]
    },
    {
        "category": "Block list: qwerty",
        "data": [
            {
                "checked": false,
                "removed": false,
                "time": 1730186798000,
                "value": "qwerty"
            },
            {
                "checked": true,
                "removed": false,
                "time": 1730186826000,
                "value": "qwerty"
            },
            {
                "checked": false,
                "removed": true,
                "time": 1730186839000,
                "value": ""
            }
        ]
    },
    {
        "category": "Block list: asdfg",
        "data": [
            {
                "checked": false,
                "removed": false,
                "time": 1730186826000,
                "value": "asdfg"
            },
            {
                "checked": false,
                "removed": true,
                "time": 1730186839000,
                "value": ""
            }
        ]
    },
    {
        "category": "Block list: zxcvb",
        "data": [
            {
                "checked": false,
                "removed": false,
                "time": 1730186826000,
                "value": "zxcvb"
            },
            {
                "checked": false,
                "removed": true,
                "time": 1730186839000,
                "value": ""
            }
        ]
    },
    {
        "category": "Block list: ewqdsacxz1",
        "data": [
            {
                "checked": false,
                "removed": false,
                "time": 1700000000000,
                "value": "ewqdsacxz"
            },
            {
                "checked": true,
                "removed": false,
                "time": 1830186839000,
                "value": "ewqdsacxz1"
            },
            {
                "checked": false,
                "removed": true,
                "time": 1930186839000,
                "value": ""
            }
        ]
    },
    {
        "category": "Block list: cxzdsaewq1",
        "data": [
            {
                "checked": false,
                "removed": false,
                "time": 1700000000000,
                "value": "cxzdsaewq"
            },
            {
                "checked": false,
                "removed": false,
                "time": 1830186839000,
                "value": "cxzdsaewq1"
            },
            {
                "checked": false,
                "removed": true,
                "time": 1930186839000,
                "value": ""
            }
        ]
    },
    {
        "category": "Block list: poilkjmnb1",
        "data": [
            {
                "checked": true,
                "removed": false,
                "time": 1700000000000,
                "value": "poilkjmnb"
            },
            {
                "checked": true,
                "removed": false,
                "time": 1830186839000,
                "value": "poilkjmnb1"
            },
            {
                "checked": false,
                "removed": true,
                "time": 1930186839000,
                "value": ""
            }
        ]
    },
    {
        "category": "Block list: rfvtgbyhn1",
        "data": [
            {
                "checked": false,
                "removed": false,
                "time": 1700000000000,
                "value": "rfvtgbyhn"
            },
            {
                "checked": false,
                "removed": false,
                "time": 1830186839000,
                "value": "rfvtgbyhn1"
            },
            {
                "checked": true,
                "removed": false,
                "time": 1930186839000,
                "value": "rfvtgbyhn1"
            }
        ]
    },
    {
        "category": "Block list: wsxedcrfv1",
        "data": [
            {
                "checked": true,
                "removed": false,
                "time": 1700000000000,
                "value": "wsxedcrfv"
            },
            {
                "checked": true,
                "removed": false,
                "time": 1830186839000,
                "value": "wsxedcrfv1"
            },
            {
                "checked": false,
                "removed": false,
                "time": 1930186839000,
                "value": "wsxedcrfv1"
            }
        ]
    }
];

test(`Check parseCheckList`, () =>
    expect(parseCheckList(field, 1700000000000)).toEqual(parsedChecklist)
)

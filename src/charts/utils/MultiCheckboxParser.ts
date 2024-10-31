import {JiraFieldInfo} from "../../common/Types.ts";

export interface ActionRecord {
    from: string;
    to: string;
}

export interface CheckboxDataItems {
    time: number;
    removed: boolean;
}

export interface CheckboxData {
    category: string;
    data: CheckboxDataItems[];
}

export function parseMultiCheckbox(field: JiraFieldInfo, createdTime: number): CheckboxData[] {

    const items: {
        name: string;
        history: CheckboxDataItems[];
    }[] = [];

    if (field.history.length > 0 && field.history[0].item.fromString) {
        const vals = field.history[0].item.fromString.split(/,(?! )/);
        vals.filter(a => a !== "" && a !== null && a != undefined).forEach(val => {
            items.push({
                name: val,
                history: [{
                    time: createdTime,
                    removed: false
                }]
            });
        });
    }

    field.history.forEach(h => {
        const fVals = h.item.fromString?.split(/,(?! )/) || [];
        const tVals = h.item.toString?.split(/,(?! )/) || [];

        const added = tVals.filter(x => !fVals.includes(x));
        const removed = fVals.filter(x => !tVals.includes(x));

        removed.filter(a => a !== "" && a !== null && a != undefined).forEach(r => {
            let item = items.find(i => i.name === r);
            if (item) {
                item.history.push({
                    time: h.time,
                    removed: true
                });
            }
        });

        added.filter(a => a !== "" && a !== null && a != undefined).forEach(a => {

            let item = items.find(i => i.name === a);

            if (item) {
                item.history.push({
                    time: h.time,
                    removed: false
                })
            } else {
                items.push({
                    name: a,
                    history: [{
                        time: h.time,
                        removed: false
                    }]
                });
            }
        });
    });

    return items.map<CheckboxData>(item => ({
        category: field.name + ": " + item.name,
        data: item.history
    }));
}

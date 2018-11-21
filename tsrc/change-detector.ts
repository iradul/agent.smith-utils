interface IField {
    field: string;
    shouldChange: boolean;
    ignoreValues: string[];
    detectInterval: number;
}

interface IFieldMeta extends IField {
    lastDetectTime: number;
}

export class ChangeDetector {
    private last_field_values = new Map<string, string>();
    public detectedFailures: IField[] = [];
    private fields: IFieldMeta[];

    constructor(fields: Array<string | IField> = []) {
        this.fields = fields.map(field => (typeof(field) === 'string') ? {
            field,
            shouldChange: true,
            ignoreValues: [],
            detectInterval: 0,
            lastDetectTime: 0,
        } : {
            field: field.field,
            shouldChange: field.shouldChange,
            ignoreValues: field.ignoreValues,
            detectInterval: field.detectInterval || 0,
            lastDetectTime: 0,
        });
    }

    public getStringValue(obj: any, field: string) {
        const split = field.split('.');
        let v = obj;
        for (const f of split) {
            v = v[f];
        }
        let value: string;
        if (typeof(v) === 'number') value = v.toString();
        else if (typeof(v) === 'boolean') value = v + '';
        else if (typeof(v) === 'object') value = JSON.stringify(v);
        else value = v;
        return value;
    }

    public add(field: string, shouldChange: boolean, detectInterval: number, ...ignoreValues: string[]): this {
        this.fields.push({ field, shouldChange, ignoreValues, detectInterval, lastDetectTime: 0 });
        return this;
    }

    public detect(obj: any) {
        const now = Date.now();
        this.detectedFailures = [];
        for (const f of this.fields) {
            const value = this.getStringValue(obj, f.field);
            const hasLastValue = this.last_field_values.has(f.field);
            if (hasLastValue
                && f.lastDetectTime + f.detectInterval <= now
                && !f.ignoreValues.find(igv => igv === value)
                && (
                    f.shouldChange && this.last_field_values.get(f.field) === value
                    || !f.shouldChange && this.last_field_values.get(f.field) !== value
                )
            ) {
                this.detectedFailures.push(f);
            }
            if (!hasLastValue || f.lastDetectTime + f.detectInterval <= now) {
                this.last_field_values.set(f.field, value);
                f.lastDetectTime = now;
            }
        }
        return this.detectedFailures.length > 0;
    }
}

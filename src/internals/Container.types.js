export type RestrictedKey = string | Symbol

export type Injectables = {
	[key: RestrictedKey]: any
}

export interface Named {
	ClassName: Symbol
}

export type LanguageMap = {
	inject: string,
	expose: string,
}

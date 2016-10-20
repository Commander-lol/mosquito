export type Provider = {
	type: 'class' | 'object' | 'function',
	strategy: 'singleton' | 'instance' | 'copy' | 'call',
	resolver: any,
	meta?: any,
}

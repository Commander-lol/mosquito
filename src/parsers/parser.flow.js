// @flow

type Node<T, B> = {
	type: T,
	body?: BabelNode[],
} & B

type BlockBody = {
	body: Array<MethodNode>,
}

type Locatable = {
	start: number,
	end: number,
}

type ClassBody = {
	body: BlockBody,
} & Locatable

export type TypeAnnotation = Node<'TypeAnnotation', {

} & Locatable>

type MethodDefinition<K, B> = Node<'MethodDefinition', {
	kind: K,
} & B>

export type ConstructorNode = MethodDefinition<'constructor', {
	params: any[]
}>

export type MethodNode = ConstructorNode

export type ClassDeclaration = Node<'ClassDeclaration', ClassBody>
export type ClassExpression = Node<'ClassExpression', ClassBody>
export type ClassNode = ClassDeclaration | ClassExpression

export type VariableDeclaration = Node<'VariableDeclaration', {
	declarations: DeclarationNode[],
}>

export type DeclarationNode = {
	init: ?BabelNode
}


export type BabelNode = ClassNode | VariableDeclaration

export type BabelProgram = {
	program: BabelNode
}

const { ServiceProvider } = require('./../../lib')
const provider = new ServiceProvider

class MyRepoImplementation {
	constructor(ThatStringINeed: string) {
		this.myStringThing = ThatStringINeed
	}
}

provider.register((app) => {
	app.when('MyRepo').singleton(MyRepoImplementation)
	app.when('ThatStringINeed').object('This is that string')
})

export class UnrelatedClass {
	constructor(MyRepo: MyRepoImplementation) {
		this.MyRepo = MyRepo
	}

	logThing() {
		console.log(this.MyRepo.myStringThing) // eslint-disable-line no-console
	}
}

const ExportedClass = ServiceProvider.provide(UnrelatedClass)

new ExportedClass().logThing()

export default MyRepoImplementation

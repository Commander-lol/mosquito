const { ServiceProvider } = require('./../../lib')
const provider = new ServiceProvider

class MyRepoImplementation {
	constructor(ThatStringINeed) {
		this.myStringThing = ThatStringINeed
	}
}

provider.register((app) => {
	app.when('MyRepo').singleton(MyRepoImplementation)
	app.when('ThatStringINeed').object('This is that string')
})

class UnrelatedClass {
	constructor(MyRepo) {
		this.MyRepo = MyRepo
	}

	logThing() {
		console.log(this.MyRepo.myStringThing) // eslint-disable-line no-console
	}
}

const ExportedClass = ServiceProvider.provide(UnrelatedClass)

new ExportedClass().logThing()

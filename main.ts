import * as Lei from "./Lei/Lei";

const random_names = ["Josh", "Rebecca", "John", "Hannah", "Ostra", "Lana", "Laura", "Lara", "Brian", "Ed", "Mark", "Jeff", "Bell"]


class TestModel extends Lei.Model {
    public run(_req: any): Object {
        let name = random_names[Math.round(Math.random() * random_names.length)];
        return { name }
    }
}
const TestView = new Lei.View("./views/index.hbs", {});

const TestController = new Lei.Controller(TestView, new TestModel());

const lei = new Lei.Engine();

lei.add_route({ controller: TestController, name: "index", path: "/", method: "get" });


lei.run();
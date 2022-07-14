import Handlebars, { Exception } from "handlebars";
import { readFile, readFileSync } from "fs";
import express from "express";


class Controller {
    private view: View;
    private model: Model;
    constructor(view: View, model: Model) {
        this.view = view;
        this.model = model;
    }
    run(req: any, res: any) {
        const data = this.model.run(req);
        this.view.set_vars(data);

        res.send(this.view.compile())
    }

}
class View {
    vars: object;
    hbs_file: string;
    constructor(hbs_file: string, vars: object) {
        this.vars = vars;
        this.hbs_file = hbs_file;
    }
    set_vars(vars: object) {
        this.vars = vars;
    }
    set_view_file(hbs_file: string) {
        this.hbs_file = hbs_file;
    }
    compile() {
        let file_content = readFileSync(this.hbs_file, { encoding: "utf8" });
        const templ_func = Handlebars.compile(file_content);

        const html = templ_func(this.vars);
        return html;
    }
}
abstract class Model {
    public run(req: any): Object { return {} };
}

type Route = {
    name: string,
    path: string,
    method?: "GET" | "get" | "post" | "POST" | undefined,
    controller: Controller
}

class Engine {
    private app = express();
    constructor() {
    }

    add_route(route: Route) {
        switch (route.method) {
            case "GET":
            case "get":
            case undefined:
                {

                    this.app.get(route.path, (req: Express.Request, res: Express.Response) => {
                        route.controller.run(req, res);
                    });
                    break;
                }
            case "POST":
            case "post": {
                this.app.post(route.path, (req, res) => {
                    route.controller.run(req, res);
                });
                break;
            }

            default: {
                throw new Exception(`The method '${route.method}' is not supported yet'`);
            }
        }
    }

    run(port: number = 8080) {
        this.app.listen(port, "localhost", () => {
            console.log("Lei/Express Server is running on port " + port);

        });
    }

}

export { Engine, View, Model, Controller, Route };
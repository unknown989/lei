// Please edit the session secret

import Handlebars, { Exception } from "handlebars";
import { readFileSync } from "fs";
import express from "express";
import session from "express-session";

type LeiResponse = {
    data: Record<string, any>,
    redirect?: string | undefined,
    status?: number | undefined,
    session_data?: Record<string, any>
}

class Controller {
    private view: View;
    private model: Model;
    constructor(view: View, model: Model) {
        this.view = view;
        this.model = model;
    }
    async run(req: any, res: any) {
        const data: LeiResponse = await this.model.run(req);
        if (data.redirect) {
            const redirect_url = new URL(data.redirect, `${req.protocol}://${req.get('host')}`);

            for (let d in data.data) {
                redirect_url.searchParams.append(d, data.data[d]);
            }
            req.session.initialised = true;
            for (let s in data.session_data) {
                req.session[s] = data.session_data[s];
            }

            res.status(data.status || 200)
            res.redirect(redirect_url)
            return;
        }

        this.view.set_vars({ ...data.data, ...data.session_data });
        res.status(data.status || 200).send(this.view.compile())
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
    public async run(req: any): Promise<LeiResponse> { return { data: {} } };
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
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }))
        this.app.use(session({ secret: "secret" }))
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
                this.app.post(route.path, async (req, res) => {
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
export type { LeiResponse }

import Handlebars, { Exception } from "handlebars";
import { readFileSync } from "fs";
import express from "express";
import session, { MemoryStore } from "express-session";
import fileUpload from "express-fileupload";


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
        if (!this.hbs_file) {
            return "";
        }
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
        this.app.use(session({
            secret: "VDAk+&&9GTS{8M?x)*kCfy#E2)+2:#%SFF_%j2x;(,zQh85duA;)fW$}QNpr,87{49y_[(7Wk7v[$&3/zqTpJfQMwz8JQ7k2Vef]?=6/WEgydZ[5QuqVb7z+3(zwWvk&inviXca7B/}-k-Ex?pPF8gwAQzveh+E$J2J+mb}=P(+Bi8-=,[r2vbpbH+fZq]J(bdX&Rp8(nR8TWH6*Gg/-y7:}_,YR}vJ9$a=-)8GxN*&P!]+aM.JE{@B@Gv4ZMV[g",
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: Date.now() + (1000 * 60 * 60 * 24 * 365)
            },
            store: new MemoryStore()
        }))
        this.app.use(fileUpload());
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

import { db } from "./db";
import fs from "fs";

function render(view: string) {
    const layout = fs.readFileSync("./views/layout/main.html", "utf8");
    return layout.replace("{{content}}", view);
}

Bun.serve({
    port: 3000,
    async fetch(req) {

        const url = new URL(req.url);

        // DASHBOARD
        if (url.pathname == "/") {
            const [mhs]: any = await db.query(
                "SELECT COUNT(*) as total FROM mahasiswa"
            );

            const [jrs]: any = await db.query(
                "SELECT COUNT(*) as total FROM jurusan"
            );

            let view = fs.readFileSync(
                "./views/dashboard/index.html", "utf8"
            );

            view = view.replace("{{total_mahasiswa}}", mhs[0].total);
            view = view.replace("{{total_jurusan}}", jrs[0].total);

            return new Response(render(view), {
                headers: { "Content-Type": "text/html" }
            });
        }

        // LIST
        if (url.pathname == "/mahasiswa") {

            const [rows]: any = await db.query(
                `SELECT 
                    mahasiswa.id,
                    mahasiswa.nama,
                    jurusan.nama_jurusan,
                    mahasiswa.angkatan
                    FROM mahasiswa
                    JOIN jurusan
                    ON mahasiswa.jurusan_id = jurusan.id`
            );

            let table = "";

            rows.forEach((m: any) => {
                table += `
<tr>
<td class="p-2">${m.id}</td>
<td class="p-2">${m.nama}</td>
<td class="p-2">${m.nama_jurusan}</td>
<td class="p-2">${m.angkatan}</td>
<td class="p-2 text-center">
<a href="/mahasiswa/edit/${m.id}" class="text-blue-500">
Edit
</a>

<a href="/mahasiswa/delete/${m.id}" class="text-red-500 ml-2">
Delete
</a>
</td>
</tr>
`
            })

            let view = fs.readFileSync(
                "./views/mahasiswa/index.html", "utf8"
            )

            view = view.replace("{{rows}}", table)

            return new Response(render(view), {
                headers: { "Content-Type": "text/html" }
            })
        }

        // FORM TAMBAH
        if (url.pathname == "/mahasiswa/create") {
            const [jurusan]: any = await db.query(
                "SELECT * FROM jurusan"
            )

            let options = ""

            jurusan.forEach((j: any) => {
                options += `<option value="${j.id}">${j.nama_jurusan}</option>`
            })
            let view = fs.readFileSync("./views/mahasiswa/create.html", "utf8");
            view = view
                .replace("{{action}}", "/mahasiswa/store")
                .replace("{{nama}}", "")
                .replace("{{jurusan_options}}", options)
                .replace("{{angkatan}}", "");
            return new Response(render(view), {
                headers: { "Content-Type": "text/html" }
            });
        }

        // SIMPAN
        if (url.pathname == "/mahasiswa/store" && req.method == "POST") {

            const body = await req.formData()

            await db.query(
                "INSERT INTO mahasiswa (nama,jurusan_id,angkatan) VALUES (?,?,?)",
                [
                    body.get("nama"),
                    body.get("jurusan_id"),
                    body.get("angkatan")
                ]
            )

            return Response.redirect("/mahasiswa", 302)

        }

        // FORM EDIT
        if (url.pathname.startsWith("/mahasiswa/edit/")) {

            const id = url.pathname.split("/")[3]

            const [rows]: any = await db.query(
                "SELECT * FROM mahasiswa WHERE id=?",
                [id]
            )

            const m = rows[0]

            let view = fs.readFileSync("./views/mahasiswa/edit.html", "utf8")

            view = view
                .replace("{{id}}", m.id)
                .replace("{{nama}}", m.nama)
                .replace("{{jurusan}}", m.jurusan)
                .replace("{{angkatan}}", m.angkatan)

            return new Response(render(view), {
                headers: { "Content-Type": "text/html" }
            })
        }

        // UPDATE DATA
        if (url.pathname.startsWith("/mahasiswa/update/") && req.method == "POST") {
            const id = url.pathname.split("/")[3];
            const body = await req.formData();
            await db.query(
                "UPDATE mahasiswa SET nama=?, jurusan=?, angkatan=? WHERE id=?",
                [
                    body.get("nama"),
                    body.get("jurusan"),
                    body.get("angkatan"),
                    id
                ]

            )

            return Response.redirect("/mahasiswa", 302)
        }

        // HAPUS
        if (url.pathname.startsWith("/mahasiswa/delete/")) {

            const id = url.pathname.split("/")[3]

            await db.query(
                "DELETE FROM mahasiswa WHERE id=?",
                [id]
            )

            return Response.redirect("/mahasiswa", 302)

        }

        // LIST JURUSAN
        if (url.pathname == "/jurusan") {

            const [rows]: any = await db.query(
                "SELECT * FROM jurusan"
            );

            let table = "";

            rows.forEach((m: any) => {
                table += `
<tr>
<td class="p-2">${m.id}</td>
<td class="p-2">${m.nama_jurusan}</td>
<td class="p-2 text-center">
<a href="/jurusan/edit/${m.id}" class="text-blue-500">
Edit
</a>

<a href="/jurusan/delete/${m.id}" class="text-red-500 ml-2">
Delete
</a>
</td>
</tr>
`
            })

            let view = fs.readFileSync(
                "./views/jurusan/index.html", "utf8"
            )

            view = view.replace("{{rows}}", table)

            return new Response(render(view), {
                headers: { "Content-Type": "text/html" }
            })
        }

        // FORM TAMBAH
        if (url.pathname == "/jurusan/create") {
            let view = fs.readFileSync("./views/jurusan/create.html", "utf8");
            view = view
                .replace("{{action}}", "/jurusan/store")
                .replace("{{nama_jurusan}}", "");
            return new Response(render(view), {
                headers: { "Content-Type": "text/html" }
            });
        }

        // SIMPAN
        if (url.pathname == "/jurusan/store" && req.method == "POST") {

            const body = await req.formData()

            await db.query(
                "INSERT INTO jurusan (nama_jurusan) VALUES (?)",
                [
                    body.get("nama_jurusan")
                ]
            )

            return Response.redirect("/jurusan", 302)

        }

        // FORM EDIT
        if (url.pathname.startsWith("/jurusan/edit/")) {

            const id = url.pathname.split("/")[3]

            const [rows]: any = await db.query(
                "SELECT * FROM jurusan WHERE id=?",
                [id]
            )

            const m = rows[0]

            let view = fs.readFileSync("./views/jurusan/edit.html", "utf8")

            view = view
                .replace("{{id}}", m.id)
                .replace("{{nama_jurusan}}", m.nama_jurusan)
            return new Response(render(view), {
                headers: { "Content-Type": "text/html" }
            })
        }

        // UPDATE DATA
        if (url.pathname.startsWith("/jurusan/update/") && req.method == "POST") {
            const id = url.pathname.split("/")[3];
            const body = await req.formData();
            await db.query(
                "UPDATE jurusan SET nama_jurusan=? WHERE id=?",
                [
                    body.get("nama_jurusan"),
                    id
                ]

            )

            return Response.redirect("/jurusan", 302)
        }

        // HAPUS
        if (url.pathname.startsWith("/jurusan/delete/")) {

            const id = url.pathname.split("/")[3]

            await db.query(
                "DELETE FROM jurusan WHERE id=?",
                [id]
            )

            return Response.redirect("/jurusan", 302)

        }

        return new Response("Not Found")

    }
})
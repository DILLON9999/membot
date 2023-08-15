async function test() {
    const promise = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('Promise resolved after 5 seconds');
        }, 5000);
    });

    return {"promise": promise}
}

async function main() {

    console.log("test1")

    const resp = await test()

    console.log("test2")

    await resp.promise

    console.log("test3")

}

main()
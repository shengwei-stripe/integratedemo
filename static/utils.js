const log = (msg) => {
    const date = new Date();
    const timestamp = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}`;

    if ($('#logs')) {
        if (typeof msg === 'string') {
            $('#logs').append(`<br/>[${timestamp}] ${msg}<br/>`);
        } else {
            $('#logs').append(`<br/>[${timestamp}]: <br/>`);
            $('#logs').append(JSON.stringify(msg, null, 3));
        }
        $("#logs").animate({
            scrollTop: $('#logs').prop("scrollHeight")
        }, 400);
    } else {
        console.log(msg);
    }
};

const postData = async (url, data={}) => {
    try {
        log("======= request ===============")
        log(data);

        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();
        log("======= response ===============")
        log(result);
        return result;
    } catch (err) {
        log("======= Error ===============")
        log({
            err
        });
    }
}

const getData = async (url) => {
    try {
        const response = await fetch(url);
        const result = await response.json();
        log("======= response ===============")
        log(result);
        return result;
    } catch (err) {
        log("======= Error ===============")
        log({
            err
        });
    }
}

const queries = () => {
    const queries = window.location.search.replace('?', '').split('&').reduce((result, q) => {
        const [name, value] = q.split('=');
        result[name] = value;
        return result;
    }, {});

    return queries;
}
const $ = s => document.querySelector(s);

const audio = $('#audio');

/* SUPABASE */

const SUPABASE_URL =
'https://tdytzcvnssqrwyamkkve.supabase.co';

const SUPABASE_KEY =
'sb_publishable_CGBw3sTAbyO7oCNanqm6cQ_T8A24SLW';

/* APP STATE */

let tracks = [];

let current = -1;

let shuffle = false;

let playlists = [];

/* PLACEHOLDER ART */

const placeholder =
makeArt('LOST\nFREQUENCY');

$('#featureArt').src = placeholder;
$('#playerArt').src = placeholder;
$('#nowArt').src = placeholder;

/* CREATE PLACEHOLDER ART */

function makeArt(t) {

```
let c = document.createElement('canvas');

c.width = c.height = 900;

let x = c.getContext('2d');

x.fillStyle = '#181818';

x.fillRect(0, 0, 900, 900);

x.fillStyle = '#eee';

x.font = '900 100px Arial';

x.textAlign = 'center';

t.split('\n').forEach((s, i) => {

    x.fillText(
        s,
        450,
        430 + i * 100
    );

});

return c.toDataURL('image/jpeg');
```

}

/* TIME FORMAT */

function fmt(s) {

```
return isFinite(s)
    ? Math.floor(s / 60) +
      ':' +
      String(Math.floor(s % 60)).padStart(2, '0')
    : '0:00';
```

}

/* HTML ESCAPE */

function esc(s = '') {

```
return s.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
}[m]));
```

}

/* LOAD SONGS */

async function loadTracks() {

```
try {

    const response = await fetch(
        `${SUPABASE_URL}/rest/v1/tracks?select=*&order=id.asc`,
        {
            headers: {
                apikey: SUPABASE_KEY,
                Authorization:
                    `Bearer ${SUPABASE_KEY}`
            }
        }
    );

    if (!response.ok) {

        throw new Error(
            await response.text()
        );

    }

    const data =
        await response.json();

    tracks = data.map(t => ({

        id: t.id,

        title:
            t.title || 'UNTITLED',

        artist:
            t.artist || '',

        album:
            t.album || '',

        year:
            t.year || '',

        notes:
            t.notes || '',

        url:
            t.audio_url,

        art:
            t.art_url || placeholder,

        duration:
            Number(t.duration) || 0

    }));

    render();

} catch (error) {

    console.error(
        'Could not load tracks:',
        error
    );

}
```

}

/* SELECT SONG */

function select(i, auto = false) {

```
if (!tracks.length) return;

current =
    (i + tracks.length) %
    tracks.length;

const t =
    tracks[current];


/* UPDATE ART */

$('#featureArt').src = t.art;

$('#playerArt').src = t.art;

$('#nowArt').src = t.art;


/* UPDATE TITLE */

$('#featureTitle').textContent =
    t.title;

$('#nowTitle').textContent =
    t.title;


/* UPDATE META */

const meta =
    [t.artist, t.album, t.year]
        .filter(Boolean)
        .join(' / ') ||
    'Private archive entry';

$('#featureMeta').textContent =
    meta;

$('#nowMeta').textContent =
    meta;


/* PLAYER TITLE */

$('#now').textContent =
    t.title.toUpperCase();


/* AUDIO */

audio.src = t.url;

audio.currentTime = 0;


/* SHOW PLAYER */

$('#player').style.display =
    'grid';


/* RENDER */

render();


/* PLAY */

if (auto) {

    audio.play().catch(() => {});

}
```

}

/* NEXT */

function next() {

```
if (!tracks.length) return;


let i;

if (
    shuffle &&
    tracks.length > 1
) {

    i =
        Math.floor(
            Math.random() *
            tracks.length
        );

    if (i === current) {

        i =
            (i + 1) %
            tracks.length;

    }

} else {

    i = current + 1;

}


select(i, true);
```

}

/* PREVIOUS */

function prev() {

```
if (!tracks.length) return;

select(
    current - 1,
    true
);
```

}

/* PLAY / PAUSE */

function toggle() {

```
if (!tracks.length) return;


if (current < 0) {

    select(0, true);

    return;

}


if (audio.paused) {

    audio.play().catch(() => {});

} else {

    audio.pause();

}
```

}

/* RENDER TRACK LIST */

function render() {

```
const q =
    $('#search')
        .value
        .toLowerCase();


$('#count').textContent =
    String(tracks.length).padStart(2, '0') +
    ' TRACK' +
    (tracks.length === 1
        ? ''
        : 'S');


const box =
    $('#tracks');

box.innerHTML = '';


const shown =
    tracks
        .map((t, i) => ({
            t,
            i
        }))
        .filter(x =>
            [
                x.t.title,
                x.t.artist,
                x.t.album
            ]
                .join(' ')
                .toLowerCase()
                .includes(q)
        );


if (!shown.length) {

    box.innerHTML =
        '<div class="empty">NO MATCHES IN ARCHIVE.</div>';

    return;

}


shown.forEach(({ t, i }) => {

    const d =
        document.createElement('div');

    d.className =
        'track' +
        (i === current
            ? ' active'
            : '');


    d.innerHTML = `

        <span class="num">
            ${String(i + 1).padStart(2, '0')}
        </span>

        <img
            src="${esc(t.art)}"
            alt=""
        >

        <div>

            <b>
                ${esc(t.title)}
            </b>

            <br>

            <small>
                ${esc(
                    [
                        t.artist,
                        t.album,
                        t.year
                    ]
                        .filter(Boolean)
                        .join(' / ')
                )}
            </small>

        </div>

        <span class="duration">
            ${fmt(t.duration)}
        </span>

        <button>
            ${i === current &&
              !audio.paused
                ? 'PAUSE'
                : 'PLAY'}
        </button>

    `;


    d.querySelector('button').onclick =
        () => {

            if (i === current) {

                toggle();

            } else {

                select(i, true);

            }

        };


    d.ondblclick =
        () => select(i, true);


    d.onclick =
        e => {

            if (
                e.target.tagName !==
                'BUTTON'
            ) {

                if (i !== current) {

                    select(i, false);

                }

            }

        };


    box.appendChild(d);

});
```

}

/* UPLOAD FILE */

async function uploadFile(
bucket,
file
) {

```
const extension =
    file.name.includes('.')
        ? '.' +
          file.name
              .split('.')
              .pop()
              .toLowerCase()
        : '';


const filename =
    `${crypto.randomUUID()}${extension}`;


const response =
    await fetch(
        `${SUPABASE_URL}/storage/v1/object/${bucket}/${filename}`,
        {
            method: 'POST',

            headers: {

                apikey:
                    SUPABASE_KEY,

                Authorization:
                    `Bearer ${SUPABASE_KEY}`,

                'Content-Type':
                    file.type ||
                    'application/octet-stream',

                'x-upsert':
                    'false'

            },

            body: file
        }
    );


if (!response.ok) {

    throw new Error(
        await response.text()
    );

}


return (
    `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`
);
```

}

/* OPEN ADD DIALOG */

$('#add').onclick =
() => $('#trackDialog').showModal();

/* OPEN PLAYLIST DIALOG */

$('#newPlaylist').onclick =
() => $('#playlistDialog').showModal();

/* SEARCH */

$('#search').oninput =
render;

/* ENTER ARCHIVE */

$('#enter').onclick =
() => {

```
    $('#archive')
        .scrollIntoView({
            behavior: 'smooth'
        });

};
```

/* FEATURE PLAY */

$('#featurePlay').onclick =
toggle;

/* BOTTOM PLAYER */

$('#play').onclick =
toggle;

$('#next').onclick =
next;

$('#prev').onclick =
prev;

/* SHUFFLE */

function toggleShuffle() {

```
shuffle = !shuffle;


$('#shuffle').textContent =
    shuffle
        ? 'SHUFFLE ON'
        : 'SHUFFLE';


$('#nowShuffle').textContent =
    shuffle
        ? '⤨ ON'
        : '⤨';
```

}

$('#shuffle').onclick =
toggleShuffle;

$('#pshuffle').onclick =
toggleShuffle;

/* AUDIO PLAY STATE */

audio.onplay = () => {

```
$('#play').textContent =
    'Ⅱ';

$('#nowPlay').textContent =
    'Ⅱ';

render();
```

};

audio.onpause = () => {

```
$('#play').textContent =
    '▶';

$('#nowPlay').textContent =
    '▶';

render();
```

};

/* AUDIO TIME */

audio.ontimeupdate = () => {

```
const percent =
    audio.duration
        ? audio.currentTime /
          audio.duration *
          100
        : 0;


$('#time').textContent =
    fmt(audio.currentTime);


$('#dur').textContent =
    fmt(audio.duration);


$('#nowTime').textContent =
    fmt(audio.currentTime);


$('#nowDuration').textContent =
    fmt(audio.duration);


$('#progress').value =
    percent;


$('#nowProgress').value =
    percent;
```

};

/* METADATA LOADED */

audio.onloadedmetadata = () => {

```
$('#dur').textContent =
    fmt(audio.duration);

$('#nowDuration').textContent =
    fmt(audio.duration);
```

};

/* SONG ENDED */

audio.onended =
next;

/* SEEK BOTTOM PLAYER */

$('#progress').oninput =
e => {

```
    if (audio.duration) {

        audio.currentTime =
            e.target.value /
            100 *
            audio.duration;

    }

};
```

/* SEEK FULL SCREEN */

$('#nowProgress').oninput =
e => {

```
    if (audio.duration) {

        audio.currentTime =
            e.target.value /
            100 *
            audio.duration;

    }

};
```

/* OPEN FULL SCREEN */

function openNowPlaying() {

```
if (!tracks.length) return;


if (current < 0) {

    select(0, false);

}


$('#nowPlaying')
    .classList
    .add('open');


document.body.style.overflow =
    'hidden';
```

}

/* CLOSE FULL SCREEN */

function closeNowPlaying() {

```
$('#nowPlaying')
    .classList
    .remove('open');


document.body.style.overflow =
    '';
```

}

/* OPEN FROM BOTTOM PLAYER */

$('#playerOpen').onclick =
openNowPlaying;

/* ALSO OPEN BY CLICKING FEATURE ART */

$('#featureArt').onclick =
openNowPlaying;

/* CLOSE */

$('#closeNowPlaying').onclick =
closeNowPlaying;

/* NOW PLAYING CONTROLS */

$('#nowPlay').onclick =
toggle;

$('#nowNext').onclick =
next;

$('#nowPrev').onclick =
prev;

$('#nowShuffle').onclick =
toggleShuffle;

/* BROWSE ARCHIVE */

function browseArchive() {

```
closeNowPlaying();

setTimeout(() => {

    $('#archive')
        .scrollIntoView({
            behavior: 'smooth'
        });

}, 100);
```

}

$('#browseArchive').onclick =
browseArchive;

$('#browseArchiveText').onclick =
browseArchive;

/* ESCAPE KEY CLOSES NOW PLAYING */

document.addEventListener(
'keydown',
e => {

```
    if (
        e.key === 'Escape' &&
        $('#nowPlaying')
            .classList
            .contains('open')
    ) {

        closeNowPlaying();

    }

}
```

);

/* MOBILE SWIPE */

function addSwipe(element) {

```
let sx = null;


element.addEventListener(
    'touchstart',
    e => {

        sx =
            e.changedTouches[0]
                .clientX;

    },
    {
        passive: true
    }
);


element.addEventListener(
    'touchend',
    e => {

        if (sx == null) return;


        const dx =
            e.changedTouches[0]
                .clientX -
            sx;


        sx = null;


        if (
            Math.abs(dx) >
            60
        ) {

            if (dx < 0) {

                next();

            } else {

                prev();

            }

        }

    },
    {
        passive: true
    }
);
```

}

addSwipe($('#featureArt'));

addSwipe($('#nowArt'));

/* ADD TRACK */

$('#trackForm').onsubmit =
async e => {

```
    e.preventDefault();


    const af =
        $('#audioFile')
            .files[0];


    const img =
        $('#artFile')
            .files[0];


    if (!af) {

        alert(
            'Choose a music file first.'
        );

        return;

    }


    const submitButton =
        e.target.querySelector(
            'button[type="submit"]'
        );


    try {

        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                'UPLOADING...';

        }


        /* UPLOAD AUDIO */

        const audioUrl =
            await uploadFile(
                'music',
                af
            );


        /* UPLOAD COVER */

        let artUrl;


        if (img) {

            artUrl =
                await uploadFile(
                    'covers',
                    img
                );

        } else {

            artUrl =
                makeArt(
                    $('#title')
                        .value
                        .trim() ||
                    'UNTITLED'
                );

        }


        /* GET DURATION */

        const tempAudio =
            new Audio(audioUrl);


        await new Promise(resolve => {

            tempAudio.onloadedmetadata =
                resolve;

            tempAudio.onerror =
                resolve;

        });


        const duration =
            Number(
                tempAudio.duration
            ) || 0;


        /* TRACK DATA */

        const track = {

            title:
                $('#title')
                    .value
                    .trim() ||
                'UNTITLED',

            artist:
                $('#artist')
                    .value
                    .trim(),

            album:
                $('#album')
                    .value
                    .trim(),

            year:
                $('#year')
                    .value,

            notes:
                $('#notes')
                    .value,

            audio_url:
                audioUrl,

            art_url:
                artUrl,

            duration

        };


        /* SAVE TO SUPABASE */

        const response =
            await fetch(
                `${SUPABASE_URL}/rest/v1/tracks`,
                {
                    method: 'POST',

                    headers: {

                        apikey:
                            SUPABASE_KEY,

                        Authorization:
                            `Bearer ${SUPABASE_KEY}`,

                        'Content-Type':
                            'application/json',

                        Prefer:
                            'return=representation'

                    },

                    body:
                        JSON.stringify(track)

                }
            );


        if (!response.ok) {

            throw new Error(
                await response.text()
            );

        }


        const saved =
            await response.json();


        const t = {

            id:
                saved[0].id,

            title:
                saved[0].title,

            artist:
                saved[0].artist,

            album:
                saved[0].album,

            year:
                saved[0].year,

            notes:
                saved[0].notes,

            url:
                saved[0].audio_url,

            art:
                saved[0].art_url,

            duration:
                Number(
                    saved[0].duration
                ) || 0

        };


        tracks.push(t);


        render();


        select(
            tracks.length - 1
        );


        $('#trackDialog')
            .close();


        e.target.reset();


    } catch (error) {

        console.error(error);


        alert(
            'UPLOAD FAILED:\n\n' +
            error.message
        );


    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                'ADD TO ARCHIVE';

        }

    }

};
```

/* PLAYLIST CREATOR */

$('#playlistForm').onsubmit =
e => {

```
    e.preventDefault();


    const n =
        $('#playlistName')
            .value
            .trim();


    if (!n) return;


    playlists.push({

        name: n,

        tracks: []

    });


    const b =
        $('#playlists');


    b.innerHTML = '';


    playlists.forEach(p => {

        const d =
            document.createElement(
                'div'
            );


        d.className =
            'playlist';


        d.textContent =
            p.name;


        d.onclick = () => {

            if (!tracks.length)
                return;


            const number =
                prompt(
                    `Add track number (1-${tracks.length})`
                );


            const i =
                Number(number) - 1;


            if (
                tracks[i] &&
                !p.tracks.includes(i)
            ) {

                p.tracks.push(i);


                d.textContent =
                    p.name +
                    ' — ' +
                    p.tracks.length +
                    ' TRACKS';

            }

        };


        b.appendChild(d);

    });


    $('#playlistDialog')
        .close();


    e.target.reset();

};
```

/* START */

loadTracks();

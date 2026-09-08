const $ = s => document.querySelector(s);
const audio = $('#audio');

const SUPABASE_URL = 'https://tdytzcvnssqrwyamkkve.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CGBw3sTAbyO7oCNanqm6cQ_T8A24SLW';

let tracks = [];
let current = -1;
let shuffle = false;
let playlists = [];

const placeholder = makeArt('LOST\nFREQUENCY');
$('#featureArt').src = placeholder;
$('#playerArt').src = placeholder;

function makeArt(t) {
    let c = document.createElement('canvas');
    c.width = c.height = 900;
    let x = c.getContext('2d');

    x.fillStyle = '#181818';
    x.fillRect(0, 0, 900, 900);

    x.fillStyle = '#eee';
    x.font = '900 100px Arial';
    x.textAlign = 'center';

    t.split('\n').forEach((s, i) => {
        x.fillText(s, 450, 430 + i * 100);
    });

    return c.toDataURL('image/jpeg');
}

function fmt(s) {
    return isFinite(s)
        ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0')
        : '0:00';
}

function esc(s = '') {
    return s.replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[m]));
}

async function loadTracks() {
    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/tracks?select=*&order=id.asc`,
            {
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const data = await response.json();

        tracks = data.map(t => ({
            id: t.id,
            title: t.title || 'UNTITLED',
            artist: t.artist || '',
            album: t.album || '',
            year: t.year || '',
            notes: t.notes || '',
            url: t.audio_url,
            art: t.art_url || placeholder,
            duration: Number(t.duration) || 0
        }));

        render();

    } catch (error) {
        console.error('Could not load tracks:', error);
    }
}

function select(i, auto = false) {
    if (!tracks.length) return;

    current = (i + tracks.length) % tracks.length;

    let t = tracks[current];

    $('#featureArt').src = t.art;
    $('#playerArt').src = t.art;
    $('#featureTitle').textContent = t.title;

    $('#featureMeta').textContent =
        [t.artist, t.album, t.year]
            .filter(Boolean)
            .join(' / ') || 'Private archive entry';

    $('#now').textContent = t.title.toUpperCase();

    audio.src = t.url;
    $('#player').style.display = 'grid';

    render();

    if (auto) {
        audio.play().catch(() => {});
    }
}

function next() {
    if (!tracks.length) return;

    let i = shuffle && tracks.length > 1
        ? Math.floor(Math.random() * tracks.length)
        : current + 1;

    if (shuffle && tracks.length > 1 && i === current) {
        i = (i + 1) % tracks.length;
    }

    select(i, true);
}

function prev() {
    select(current - 1, true);
}

function toggle() {
    if (current < 0) return select(0, true);

    audio.paused ? audio.play() : audio.pause();
}

function render() {
    let q = $('#search').value.toLowerCase();

    $('#count').textContent =
        String(tracks.length).padStart(2, '0') +
        ' TRACK' +
        (tracks.length === 1 ? '' : 'S');

    let box = $('#tracks');
    box.innerHTML = '';

    let shown = tracks
        .map((t, i) => ({ t, i }))
        .filter(x =>
            [x.t.title, x.t.artist, x.t.album]
                .join(' ')
                .toLowerCase()
                .includes(q)
        );

    if (!shown.length) {
        box.innerHTML = '<div class="empty">NO MATCHES IN ARCHIVE.</div>';
        return;
    }

    shown.forEach(({ t, i }) => {
        let d = document.createElement('div');

        d.className = 'track';

        d.innerHTML = `
            <span class="num">${String(i + 1).padStart(2, '0')}</span>
            <img src="${esc(t.art)}">
            <div>
                <b>${esc(t.title)}</b><br>
                <small>${esc(
                    [t.artist, t.album, t.year]
                        .filter(Boolean)
                        .join(' / ')
                )}</small>
            </div>
            <span class="duration">${fmt(t.duration)}</span>
            <button>PLAY</button>
        `;

        d.querySelector('button').onclick = () =>
            i === current ? toggle() : select(i, true);

        d.ondblclick = () => select(i, true);

        box.appendChild(d);
    });
}

async function uploadFile(bucket, file) {
    const extension =
        file.name.includes('.')
            ? '.' + file.name.split('.').pop().toLowerCase()
            : '';

    const filename =
        `${crypto.randomUUID()}${extension}`;

    const response = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${bucket}/${filename}`,
        {
            method: 'POST',
            headers: {
                apikey: SUPABASE_KEY,
                Authorization: `Bearer ${SUPABASE_KEY}`,
                'Content-Type': file.type || 'application/octet-stream',
                'x-upsert': 'false'
            },
            body: file
        }
    );

    if (!response.ok) {
        throw new Error(await response.text());
    }

    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${filename}`;
}

$('#add').onclick = () => $('#trackDialog').showModal();
$('#newPlaylist').onclick = () => $('#playlistDialog').showModal();

$('#search').oninput = render;

$('#enter').onclick = () =>
    $('#archive').scrollIntoView();

$('#featurePlay').onclick = toggle;
$('#play').onclick = toggle;
$('#next').onclick = next;
$('#prev').onclick = prev;

$('#shuffle').onclick = () => {
    shuffle = !shuffle;
    $('#shuffle').textContent =
        shuffle ? 'SHUFFLE ON' : 'SHUFFLE';
};

$('#pshuffle').onclick = () =>
    $('#shuffle').click();

audio.onplay = () =>
    $('#play').textContent = 'Ⅱ';

audio.onpause = () =>
    $('#play').textContent = '▶';

audio.ontimeupdate = () => {
    $('#time').textContent = fmt(audio.currentTime);
    $('#dur').textContent = fmt(audio.duration);

    $('#progress').value =
        audio.duration
            ? audio.currentTime / audio.duration * 100
            : 0;
};

audio.onended = next;

$('#progress').oninput = e => {
    if (audio.duration) {
        audio.currentTime =
            e.target.value / 100 * audio.duration;
    }
};

let sx = null;

$('#featureArt').ontouchstart = e => {
    sx = e.changedTouches[0].clientX;
};

$('#featureArt').ontouchend = e => {
    if (sx == null) return;

    let dx =
        e.changedTouches[0].clientX - sx;

    sx = null;

    if (Math.abs(dx) > 60) {
        dx < 0 ? next() : prev();
    }
};

$('#trackForm').onsubmit = async e => {
    e.preventDefault();

    const af = $('#audioFile').files[0];
    const img = $('#artFile').files[0];

    if (!af) {
        alert('Choose a music file first.');
        return;
    }

    const submitButton =
        e.target.querySelector('button[type="submit"]');

    try {
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'UPLOADING...';
        }

        const audioUrl =
            await uploadFile('music', af);

        let artUrl;

        if (img) {
            artUrl =
                await uploadFile('covers', img);
        } else {
            artUrl =
                makeArt(
                    $('#title').value.trim() || 'UNTITLED'
                );
        }

        const tempAudio = new Audio(audioUrl);

        await new Promise(resolve => {
            tempAudio.onloadedmetadata = resolve;
            tempAudio.onerror = resolve;
        });

        const duration =
            Number(tempAudio.duration) || 0;

        const track = {
            title:
                $('#title').value.trim() || 'UNTITLED',

            artist:
                $('#artist').value.trim(),

            album:
                $('#album').value.trim(),

            year:
                $('#year').value,

            notes:
                $('#notes').value,

            audio_url:
                audioUrl,

            art_url:
                artUrl,

            duration
        };

        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/tracks`,
            {
                method: 'POST',
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    Prefer: 'return=representation'
                },
                body: JSON.stringify(track)
            }
        );

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const saved = await response.json();

        const t = {
            id: saved[0].id,
            title: saved[0].title,
            artist: saved[0].artist,
            album: saved[0].album,
            year: saved[0].year,
            notes: saved[0].notes,
            url: saved[0].audio_url,
            art: saved[0].art_url,
            duration: Number(saved[0].duration) || 0
        };

        tracks.push(t);

        render();
        select(tracks.length - 1);

        $('#trackDialog').close();
        e.target.reset();

    } catch (error) {
        console.error(error);
        alert(
            'UPLOAD FAILED:\n\n' +
            error.message
        );

    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'UPLOAD';
        }
    }
};

$('#playlistForm').onsubmit = e => {
    e.preventDefault();

    let n =
        $('#playlistName').value.trim();

    if (!n) return;

    playlists.push({
        name: n,
        tracks: []
    });

    let b = $('#playlists');
    b.innerHTML = '';

    playlists.forEach(p => {
        let d =
            document.createElement('div');

        d.className = 'playlist';
        d.textContent = p.name;

        d.onclick = () => {
            if (!tracks.length) return;

            let n =
                prompt(
                    `Add track number (1-${tracks.length})`
                );

            let i = Number(n) - 1;

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

    $('#playlistDialog').close();
    e.target.reset();
};

loadTracks();

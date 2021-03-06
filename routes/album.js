const cheerio = require('cheerio');

const album = {
  // 专辑信息
  '/': async ({req, res, request}) => {
    const {albummid} = req.query;

    if (!albummid) {
      return res.send({
        result: 500,
        errMsg: 'albummid 不能为空',
      });
    }

    try {
      const info = await album["/songs"]({req, request});
      const pageInfo = await request(`https://y.qq.com/n/yqq/album/${albummid}.html`, {dataType: 'raw'});
      const $ = cheerio.load(pageInfo);

      const albumInfo = info.data.list[0].album;

      const otherInfo = {};

      $('.data_info__item').each((i, v) => {
        const str = cheerio.load(v).text();
        if (str.indexOf('唱片公司') >= 0) {
          otherInfo.company = str.replace('唱片公司：', '');
        } else if (str.indexOf('发行时间') >= 0) {
          otherInfo.publishTime = str.replace('发行时间：', '');
        }
      });

      res.send({
        result: 100,
        data: {
          ...otherInfo,
          name: albumInfo.name,
          subTitle: albumInfo.subtitle,
          id: albumInfo.id,
          mid: albummid,
          ar: [
            {
              name: $('.data__singer_txt').text(),
              id: $('.data__singer_txt').data('id'),
              mid: $('.data__singer_txt').data('mid'),
            },
          ],
          picUrl: $('#albumImg').attr('src'),
          desc: $('#album_desc .about__cont p').text(),
        },
      })
    } catch (err) {
      res.send({
        result: 400,
        errMsg: err.message,
      })
    }

  },

  // 专辑的歌曲信息
  '/songs': async ({req, res, request}) => {
    const {raw, albummid} = req.query;

    if (!albummid) {
      return res.send({
        result: 500,
        errMsg: 'albummid 不能为空',
      });
    }
    const result = await request({
      url: 'https://u.y.qq.com/cgi-bin/musicu.fcg?g_tk=5381&format=json&inCharset=utf8&outCharset=utf-8',
      data: {
        data: JSON.stringify({
          comm: {
            ct: 24,
            cv: 10000
          },
          albumSonglist: {
            method: "GetAlbumSongList",
            param: {
              albumMid: albummid,
              albumID: 0,
              begin: 0,
              num: 999,
              order: 2
            },
            module: "music.musichallAlbum.AlbumSongList"
          }
        })
      }
    });

    if (Number(raw)) {
      return res.send(result);
    }

    const resData = {
      result: 100,
      data: {
        list: result.albumSonglist.data.songList.map((item) => item.songInfo),
        total: result.albumSonglist.data.totalNum,
        albummid: result.albumSonglist.data.albumMid,
      }
    };

    res && res.send(resData);
    return resData;
  }
};

module.exports = album


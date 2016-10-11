


         var fm = (function(){

            function Fm($node) {
                this.$node = $node
                this.$audio = $node.find('.player')
                this.audio = this.$audio.get(0)

                // 歌曲信息
                this.$pic = $node.find('.fm-pic')
                this.$title = $node.find('.info-title')
                this.$artist = $node.find('.info-artist')

                // control panel
                this.$play = $node.find('.control-play')
                this.$next = $node.find('.control-next')
                this.$circle = $node.find('.control-circle')
                this.$favor = $node.find('.control-favor')
                this.$list = $node.find('.control-list')

                // 歌曲进度条
                this.$progress = $node.find('.fm-progress')
                this.$progressStatus = $node.find('.progress-status')
                this.$curTime = $node.find('.current-time')
                this.clock = 0
                this.$totalTime = $node.find('.total-time')
                this.totalTime = 0

                // 音量控制
                this.$sound = $node.find('.sound-icon')
                this.$soundControl = $node.find('.sound-control')
                this.$soundStatus = $node.find('.sound-status')

                //下载
                this.$download = $node.find('.operation-download')

                //上一曲
                this.$prev = $node.find('.fm-prev')
                this.prevSong = null
                this.curSong = null

                //下一曲lock
                this.isGetsong = false


                //频道
                this.$channel = $('.channel-list')
                this.currentChannel = ''
                this.channel = {
                    tuijian: this.$channel.find('.channel-tuijian'),
                    shiguang: this.$channel.find('.channel-shiguang'),
                    fengge: this.$channel.find('.channel-fengge'),
                    xinqing: this.$channel.find('.channel-xinqing'),
                    yuzhong: this.$channel.find('.channel-yuzhong')
                }

                // like
                this.$like = $node.find('.fm-like')
                this.$likeHolder = $node.find('.like-holder')
                this.likeSong = []

                this.bindEvent()
                this.getSong()
                this.setVolume(30)
                this.getChannel()
            }

            Fm.prototype.bindEvent = function() {
                var _this = this
                var $audio = this.$audio
                var audio = this.audio

                this.$audio
                    .on('durationchange', function(){
                        _this.setDuration()
                    })
                    .on('canplay', function(){
                        _this.play()
                        _this.isGetsong = false
                    })
                    .on('play', function(){
                        _this.$audio.data('play', true)
                        _this.setCurTime()
                        _this.$play.removeClass('icon-play').addClass('icon-stop')
                        _this.isLike()
                    })
                    .on('pause',function(){
                        _this.$audio.data('play', false)
                        _this.$play.removeClass('icon-stop').addClass('icon-play')
                    })
                    .on('volumechange', function(){
                        if (audio.muted) {
                            _this.$sound.removeClass('icon-sound').addClass('icon-mute')
                            _this.$soundStatus.width(0)
                            return
                        }
                        _this.$sound.removeClass('icon-mute').addClass('icon-sound')
                    })
                    .on('ended', function(){
                        _this.getSong()
                    })

                this.$play.on('click', function(){
                    if (!$audio.data('play')) {
                        audio.play()
                        _this.$play.attr('title', '暂停')
                    } else {
                        audio.pause()
                        _this.$play.attr('title', '播放')
                    }
                })

                this.$next.on('click', function(){
                    _this.getSong()
                })

                this.$circle.on('click', function(){
                    _this.isCircle()
                })

                this.$progress.on('click', function(event){
                    var percentage = _this.setProgress(event.offsetX)
                    audio.currentTime = percentage*_this.totalTime
                    _this.$curTime.text(_this.formatTime(audio.currentTime))
                })

                this.$sound.on('click', function(){
                    if (audio.muted) {
                        audio.muted = false
                        _this.setVolume()
                    } else {
                        audio.muted = true
                    }
                })

                this.$soundControl.on('click', function(event){
                    if (audio.muted) {
                        audio.muted = false
                    }
                    _this.setVolume(event.offsetX)
                })

                this.$prev.on('click', function(){
                    _this.songInit(_this.prevSong)
                    _this.renderLrc(_this.prevSong.lrc)
                })

                this.$channel.on('click', function(event){
                    _this.accordion.call(this)
                    if ($(event.target).data('channelid')) {
                        _this.currentChannel = $(event.target).data('channelid')
                        _this.getSong(_this.currentChannel)
                    }
                })

                this.$list.on('click', function(){
                    _this.$like.slideToggle()

                })

                this.$favor.on('click', function(){
                    var $this = $(this)
                    _this.$likeHolder.addClass('hide')
                    _this.like()
                    if ($this.hasClass('ilike')) {
                        $this.removeClass('ilike')
                        _this.removeLike()
                    } else {
                        $this.addClass('ilike')
                    }
                })

                this.$like.on('click','.like-item', function(){
                    var $this = $(this)
                    var song = _this.likeSong[$this.index()-1]
                    _this.songInit(song)
                    _this.play()
                    _this.renderLrc(song.lrc)
                    _this.curSong = song
                })
            }

            Fm.prototype.formatTime = function(time) {
                var min = Math.floor(time/60)
                var sec = Math.floor(time%60)
                if (sec < 10) {
                    sec = '0' + sec
                }
                return min+':'+sec
            }

            Fm.prototype.setDuration = function() {
                this.$totalTime.text(this.formatTime(this.audio.duration))
                this.totalTime = Math.floor(this.audio.duration)
            }

            Fm.prototype.setCurTime = function() {
                var _this = this
                var $curTime = this.$curTime
                var $audio = this.$audio
                var audio = this.audio

                var set = function() {
                    if (!$audio.data('play')) {return}
                    $curTime.text(_this.formatTime(audio.currentTime))
                    _this.setProgress()
                    _this.setLrcEffect()
                    _this.clock = setTimeout(set, 1000)
                }
                set()
            }

            Fm.prototype.setProgress = function(offsetX) {
                var proWidth = this.$progress.innerWidth()
                var $progressStatus = this.$progressStatus
                var percentage = 0
                var audio = this.audio
                if (offsetX) {
                    percentage = (offsetX/proWidth)*100
                } else {
                    percentage = (audio.currentTime/this.totalTime)*100
                }
                $progressStatus.width(percentage+'%')
                return percentage/100
            }

            Fm.prototype.setVolume = function(offsetX) {
                var audio = this.audio
                var $soundStatus = this.$soundStatus
                var soundWidth = this.$soundControl.innerWidth()
                if (offsetX) {
                    audio.volume = (offsetX/soundWidth)
                }
                $soundStatus.width(audio.volume*soundWidth)
            }

            Fm.prototype.play = function() {
                this.audio.play()
                this.setCurTime()
            }

            Fm.prototype.isCircle = function() {
                var $audio = this.$audio
                var $circle = this.$circle
                if (!$audio.attr('loop')) {
                    $audio.attr('loop', true)
                    $circle
                        .removeClass('icon-circle')
                        .addClass('icon-shuffle')
                        .attr('title', '随机播放')
                } else {
                    $audio.attr('loop',false)
                    $circle
                        .removeClass('icon-shuffle')
                        .addClass('icon-circle')
                        .attr('title', '循环播放')
                }
            }

            Fm.prototype.getSong = function(channelid) {
                var _this = this

                if(this.isGetsong) return
                this.isGetsong = true

                this.prevSong = this.curSong
                clearTimeout(this.clock)

                channelid || (channelid = 4)
                $.ajax({
                    method: 'get',
                    url: 'http://api.jirengu.com/fm/getSong.php?',
                    data: {
                        channel: channelid
                    },
                    dataType: 'jsonp'
                }).done(function(response){
                    var song = response.song[0]
                    var songId = song.sid

                    _this.curSong = song
                    _this.songInit(song)
                    _this.getLrc(songId) //获取歌词
                    _this.play()

                    if (_this.prevSong) {
                        _this.initPrevSong(_this.prevSong)
                    }
                })
            }

            Fm.prototype.songInit = function(song) {
                var url = song.url
                var pic = song.picture
                var title = song.title
                var artist = song.artist

                this.$pic.html($('<img />').attr('src', pic))
                this.$title.text(title)
                this.$artist.text(artist)
                this.$audio.attr('src', url)
                this.$download.attr('href', url)
            }

            Fm.prototype.getLrc = function(songId) {
                var _this = this
                $.post({
                    url: 'http://api.jirengu.com/fm/getLyric.php',
                    data: {
                        sid: songId
                    },
                    dataType: 'json'
                }).done(function(response){
                    var lrc = response.lyric
                    _this.renderLrc(lrc)
                    _this.curSong.lrc = lrc
                })
            }

            Fm.prototype.renderLrc = function(lrc) {
               var $lrcList = $('<ul class="lrc-list"></ul>')
               var regex = /\[(\d+\:\d+\.\d+)\]([^\[\n]+)/g
               var lrcArr = lrc.match(regex)
               lrcArr.shift()

               var format = function(min, sec) {
                    var min = parseInt(min, 10)
                    var sec = parseInt(sec, 10)
                    return min*60 + sec
               }
               $.each(lrcArr, function(index, item){
                    var lrcLine = item.match(/\[(\d+)\:(\d+)\.\d+\]([^\[\n]+)/)
                    var time = format(lrcLine[1], lrcLine[2])
                    $('<li />')
                        .data('timeline', time)
                        .text(lrcLine[3])
                        .appendTo($lrcList)
               })
               this.$node.find('.fm-lrc').html($lrcList)

            }

            Fm.prototype.setLrcEffect = function() {
                var $lrcItem = this.$node.find('.lrc-list>li')
                var audio = this.audio
                $lrcItem.each(function(index, item) {
                    if (Math.floor(audio.currentTime) === $(item).data('timeline')) {
                        $(item)
                            .addClass('lrc-show')
                            .siblings()
                            .removeClass('lrc-show')
                    }
                })
            }

            Fm.prototype.initPrevSong = function(song) {
                this.$prev.html($('<img />').attr('src', song.picture))
            }

            Fm.prototype.getChannel = function() {
                var _this = this
                $.ajax({
                    method: 'post',
                    url: 'http://api.jirengu.com/fm/getChannels.php',
                    dataType: 'json'
                }).done(function(response){
                    var channelsArr = response.channels
                    $.each(channelsArr, function(index, item){
                        _this.renderChannel(item)
                    })
                })
            }

            Fm.prototype.renderChannel = function(item) {
                var id = item.channel_id.match(/\_(\w+)\_/)[1]
                var $li = $('<li />')
                            .text(item.name)
                            .data('channelid', item.channel_id)
                switch (id) {
                    case 'tuijian':
                        $li.appendTo(this.channel.tuijian)
                        break
                    case 'shiguang':
                        $li.appendTo(this.channel.shiguang)
                        break
                    case 'fengge':
                        $li.appendTo(this.channel.fengge)
                        break
                    case 'xinqing':
                        $li.appendTo(this.channel.xinqing)
                        break
                    case 'yuzhong':
                        $li.appendTo(this.channel.yuzhong)
                }
            }

            Fm.prototype.accordion = function() {
                var $this = $(this)
                if ($this.hasClass('channel-show')) {
                    $this.removeClass('channel-show')
                } else {
                    $this
                        .addClass('channel-show')
                        .siblings()
                        .removeClass('channel-show')
                }
            }

            Fm.prototype.like = function() {
                var song = this.curSong
                song.isLike = true
                if(this.likeSong.indexOf(song) === -1) {
                    this.likeSong.push(song)
                    this.renderLikeSong(song)
                }
            }

            Fm.prototype.renderLikeSong = function(song) {
                var $likeList = this.$like.find('.like-list')
                var template = '<li class="like-item">'
                             +   '<div class="like-img">'
                             +     '<img src="{{picture}}" alt="image">'
                             +   '</div>'
                             +   '<div class="title-contain">'
                             +     '<div class="like-title" title="{{title}}">'
                             +       '{{title}}'
                             +     '</div>'
                             +   '</div>'
                             +   '<div class="artist-contain">'
                             +     '<div class="like-artist" title="{{artist}}">'
                             +       '{{artist}}'
                             +     '</div>'
                             +   '</div>'
                             + '</li>'
                var result = template.replace(/\{\{([^\}]+)\}\}/g, function(match, p1){
                    return song[p1]
                })
                $(result).appendTo($likeList)
            }

            Fm.prototype.renderLikeStatus = function() {
                this.$favor.css('background-color', 'rgba(255,0,0,0.6)')
            }

            Fm.prototype.removeLike = function() {
                var $like = this.$like
                var $likeItem = this.$like.find('.like-item')
                var likeSong = this.likeSong
                var index = likeSong.indexOf(this.curSong)
                likeSong.splice(index, 1)
                $likeItem[index].remove()
                if (!likeSong.length) {
                    $like.find('.like-holder').removeClass('hide')
                }
            }

            Fm.prototype.isLike = function() {
              var $favor = this.$favor
              if(this.curSong.isLike) {
                $favor.addClass('ilike')
              } else {
                $favor.removeClass('ilike')
              }
            }

            return new Fm($('.fm'))
         })()
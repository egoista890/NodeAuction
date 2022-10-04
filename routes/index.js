// 기본적인 요청들을 처리할 index.js 파일

const express = require('express');

const router = express.Router();

const schedule = require('node-schedule');

const {Good, Auction, User} = 
    require('../models');
const {isLoggedIn, isNotLoggedIn} = 
    require('./middleware');

    

//모든 요청
router.use((req, res, next) => {
    //request 객체의 user 정보를 response 객체의 user에 대입
    res.locals.user = req.user;
    next();
});

//기본 요청을 처리
router.get("/", async(req, res, next)=>{
    try{
        //goods 테이블에서 SoldId가 null 인 데이터만 조회
        const goods = await Good.findAll(
            {where:{SoldId:null}})
        res.render('main', {
            title:'NodeAuction',
            goods
        })

    }catch(err){
        console.error(err);
        next(err)
    }
})

//회원가입 버튼을 눌렀을 때 처리
router.get('/join', isNotLoggedIn, (req, res) => {
    res.render('join', {title:'회원가입'});
});

//상품 등록을 위한 요청 처리 코드
router.get('/good', isLoggedIn, (req, res) => {
    res.render('good', {title:'상품 등록'})
});

//파일 업로드 설정
const multer = require('multer');
const path = require('path');
const fs = require('fs');

//파일이 저장될 디렉토리를 생성
try{
    fs.readdirSync('public/uploads');
}catch(err){
    fs.mkdirSync('public/uploads');
}

//파일 업로드 객체 생성
const upload = multer({
    storage:multer.diskStorage({
        destination(req, file, cb){
            cb(null, 'public/uploads/')
        },
        filename(req, file, cb){
            const ext = path.extname(file.originalname);
            //문자열을 더하는 부분을 문자열 템플릿으로 수정
            cb(null, path.basename(file.originalname, ext) 
            + new Date().valueOf() + ext);
        }
    }), limits:{fileSize: 5 * 1024 * 1024}
})

//상품 등록
router.post('/good',isLoggedIn, 
    upload.single('img'), async(req, res, next)=>{
     
        //파라미터 읽어오기
        const {name, price} = req.body;

        await Good.create({
            OwnerId:req.user.id,
            name,
            img:req.file.filename,
            price
        });

        //하루 뒤에 가장 큰 금액을 제시한 유저에게 낙찰
        const end = new Date();
        end.setDate(end.getDate() + 1);

        schedule.scheduleJob(end, async()=>{
            const success = await Auction.findOne({
                where:{GoodId: good.id},
                order:[['bid', 'DESC']]
            });

            await Good.update(
                {SoldId:success.UserId},
                {where : {id:good.id}});
            
            await User.update(
            {
                money:sequelize.literal(`money-${success.bid}`)
            }, {where:{id:success.UserId}}) 

        })
        res.redirect('/');

})

//입장 버튼을 눌렀을 때 처리
router.get('/good/:id', isLoggedIn, 
    async(req, res, next) => {
        try{
            //하나의 상품 정보 와 입찰 정보를 가져오기
            const [good, auction] = await Promise.all(
                [
                    Good.findOne({
                        where:{id:req.params.id},
                        include:{
                            model:User,
                            as:'Owner'
                        }
                    }),
                    Auction.findAll({
                        where:{GoodId:req.params.id},
                        include:{model:User},
                        order:[['bid', 'ASC']]
                    })
                ])
            res.render('aution', {
                title:`${good.name}`,
                good,
                auction
            })
            
        }catch(err){
            console.error(err);
            next(err);
        }
})

//입찰 관련 요청을 처리하는 코드
//입찰 버튼을 눌렀을 때 처리
router.post('/good/:id/bid', isLoggedIn, 
    async(req, res, next) => {
        try{
            //파라미터를 읽어오기
            const {bid, msg} = req.body;

            //현재 상품에 대한 입찰 정보를 가져오기
            const good = await Good.findOne({
                where:{id:req.params.id},
                include:{model:Auction},
                order:[[{model:Auction}, 'bid', 'DESC']]
            });

            if(good.price >= bid){
                return res.status(403).send(
                    '시작 가격보다 높은 금액을 제시해야 합니다.');
            }
            if(new Date(good.createdAt).valueOf() + 
                (24*60*60*1000) < new Date()){
                return res.status(403).send(
                    '경매가 이미 종료되었습니다.');
            }
            if(good.Auctions[0] && good.Auctions[0].bid >= bid){
                return res.status(403).send(
                    '이전 입찰가보다 높은 금액을 제시해야 합니다.');
            }

            //입찰 추가
            const result = await Auction.create({
                bid,
                msg,
                UserId:req.user.id,
                GoodId:req.params.id
            });

            //실시간 으로 등록된 정보를 웹 소켓을 이용해서 전달
            req.app.get('io').to(req.params.id).emit('bid',{
                bid:result.bid,
                msg:result.msg,
                nick:req.user.nick
            });
            return res.send('ok');

        }catch(err){
            console.error(err);
            next(err);
        }
})

//낙찰 목록 조회 요청을 처리하는 코드
router.get('/list', isLoggedIn, 
    async(req, res, next) => {
        try{
            //로그인 한 유저가 입찰 목록을 전부 찾아오기
            const goods = await Good.findAll({
                where:{SoldId:req.user.id},
                include:{model:Auction},
                order:[[{model:Auction}, 'bid', 'DESC']]
            });
            res.render('list', 
            {title:"입찰 목록",
                goods});
        }catch(err){
            console.error(err);
            next(err);
        }
})

module.exports = router;
//회원 정보 관련 요청을 처리하기 위한 auth.js 파일

const express = require('express');

const passport = require('passport');
const bcrypt = require('bcrypt');

const {isLoggedIn, isNotLoggedIn} = 
    require('./middleware');
const User = require('../models/user');

const router = express.Router();

//회원 가입 처리
router.post('/join', isNotLoggedIn, 
    async(req, res, next) => {
        //파라미터 읽어오기
        const {email, nick, password, money} = req.body;
        try{
            //email 중복 확인을 위해서 데이터를 가져오기
            const exUser = await User.findOne(
                {where:{email}});
            //email이 존재하면 메시지 와 함께
            //회원 가입 페이지로 이동
            if(exUser){
                return res.redirect(
                    '/join?joinError=이미 가입된 이메일');
            }
            //비밀번호 암호화
            const hash = await bcrypt.hash(password, 12);
            //데이터 저장
            await User.create({
                email,
                nick,
                password:hash,
                money
            });
            //메인 페이지로 리다이렉트
            return res.redirect('/');

        }catch(error){
            console.error(error);
            return next(error);
        }
})

//로그인 
router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local',
         (authError, user, info) => {
            //로그인 요청 시 에러가 발생하면 중단
            if(authError){
                console.error(authError);
                return next(authError);
            }
            if(!user){
                //로그인 실패했을 때
                //메인 요청으로 이동하는데 로그인 실패
                //메시지를 가지고 이동합니다.
                return res.redirect(
                    `/?loginError=${info.message}`);
            }
            return req.login(user, (loginError)=>{
                if(loginError){
                    console.error(loginError);
                    return next(loginError);
                }
                //정상적으로 로그인에 성공하면
                return res.redirect('/');
            })
    })(req, res, next);
});

//로그아웃
router.get('/logout', isLoggedIn, (req, res) => {
  req.logout(function(err){
        if(err){
            return next(err);
        }
        req.session.destroy();
        res.redirect('/');
  });
});


module.exports = router;
//경매가 진행된 후 입찰을 했는데 어떤 이유인지 알 수 없지만 낙찰이 되지 않은 경우 서버를 재실행 할 때 낙찰을 하도록 하기 위한 내용

const {Op} = require('Sequelize');
const {Good, Auction, User, sequelize} = 
    require('./models');

module.exports = async() => {
    try{
        //어제 날짜 만들기
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        //어제 날짜 보다 이전에 생성된 데이터 찾아오는데
        //SoldId 가 없는 데이터만 찾아오기
        const targets = await Good.findAll({
            where:{
                SoldId:null,
                createdAt:{[Op.lte]:yesterday}
            }
        });

        //낙찰되지 않은 데이터를 낙찰
        targets.forEach(async(target) => {
            const success = await Auction.findOne({
                where:{GoodId: target.id},
                order:[['bid', 'DESC']]
            });

            await Good.update({SoldId:success.UserId},
                {where:{id:target.id}});

            await User.update(
                {money:sequelize.literal(
                    `money-${success.bid}`)},
                {where:{id:success.id}});
        });
    }catch(err){
        console.error(err);
        next(err);
    }
}
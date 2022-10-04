//회원 정보 테이블 과 연동할 모델 파일

const Sequelize = require('sequelize')

module.exports = class User extends Sequelize.Model{
    static init(sequelize){
        return super.init({
            email:{
                type:Sequelize.STRING(40),
                allowNull:false,
                unique:true
            },
            nick:{
                type:Sequelize.STRING(20),
                allowNull:false
            },
            password:{
                type:Sequelize.STRING(100),
                allowNull:true
            },
            money:{
                type:Sequelize.INTEGER,
                allowNull:false,
                defaultValue:0
            }
        }, {
            sequelize,
            timestamps:true,
            paranoid:true,
            modelName:'User',
            tableName:'users',
            charset:'utf8',
            collate:'utf8_general_ci'
        })
    }

    static associate(db){
        db.User.hasMany(db.Auction)
    }
}
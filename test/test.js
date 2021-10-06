const chai = require("chai")
const expect = chai.expect
const chaiHttp = require("chai-http")
chai.use(chaiHttp)
const server = require('../server')
const addr = "https://mila-autio-bci-graded-exercise.herokuapp.com/"

describe("BCI API Tests", function(){

    before(function(){
        server.start
    })

    after(function(){
        server.close
    })

    describe('Post /signup and post /login at the same time', function(){
        
        it('Sign up a new account to the system and give the status code 201', function(done){ 
            chai.request(addr)
            .post('/signup')
            .send({
                userName : "user-example",
                passWord : "salasana",
                phone : "1231231233",
                email : "email@gmail.com"
            })
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(201)
                done()
            })
        })

        it('Try to sign up a new account with missing information. Should respond with the error code 400', function(done){ 
            chai.request(addr)
            .post('/signup')
            .send({
                userName : "user-example",
                passWord : "salasana",
                phone : "1231231233"
                
            })
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(400)
                done()
            })
        })

        it('Login with the account using http basic and give the status code 201', function(done){ 
            chai.request(addr)
            .post('/login')
            .auth('user-example', 'salasana')
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(201)
                done()
            })
        })

        it('Try login with a wrong password. Should response with the error code 401 ', function(done){ 
            chai.request(addr)
            .post('/login')
            .auth('user-example', 'wrongpassword')
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(401)
                done()
            })
        })
     
    })

    describe('POST and GET /postings endpoint', function(){
        it('Create posting with valid information and response with the status code 200', function(done){ 
            chai.request(addr)
            .post('/postings')
            .send({
                title : "Test Posting",
                description : "This is a description of test posting",
                category : "test-postings",
                location : "earth",
                price : "23€",
                deliveryType : "Shipping",
            })
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(200)
                done()
            })
        })

        it('Create posting with missing information and response with the status code 400', function(done){ 
            chai.request(addr)
            .post('/postings')
            .send({
                title : "Test Posting",
                description : "This is a description of test posting",
                category : "test-postings",
            })
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(400)
                done()
            })
        })

        /*it('Get all postings', function(done){
            chai.request(addr)
            .post('/postings')
            .end()
        })*/
    })


})



const chai = require("chai")
const expect = chai.expect
const chaiHttp = require("chai-http")
chai.use(chaiHttp)
const server = require('../server')
const addr = "localhost:80"
var token = ""
var id = ""

describe("BCI API Tests", function(){

    before(function(){
        server.start()
    })

    after(function(){
        server.close()
    })

    describe('Post /signup and post /login', function(){
        
        //sign up
        it('Sign up a new account to the system and give the status code 201', function(done){ 
            chai.request(addr)
            .post('/signup')
            .send({
                userName : "user-example",
                password : "salasana",
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
                password : "salasana",
                phone : "1231231233"
                
            })
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(400)
                done()
            })
        })

        //login
        it('Login with the account using http basic and give the status code 200', function(done){ 
            chai.request(addr)
            .post('/login')
            .auth('user-example', 'salasana')
            .end(function(err,res){
                token = res.body.token
                expect(err).to.be.null
                expect(res).to.have.status(200)
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
        //create postings
        it('Create posting with valid information and response with the status code 200', function(done){ 
            chai.request(addr)
            .post('/postings')
            .set({ "Authorization": `Bearer ${token}` })
            .send({
                title : "Test Posting",
                description : "This is a description of test posting",
                category : "test-postings",
                location : "earth",
                price : "23€",
                deliveryType : "Shipping",
            })
            .end(function(err,res){
                id = res.body.id
                expect(err).to.be.null
                expect(res).to.have.status(200)
                done()
            })
        })

        it('Create posting without authentication and response with the status code 401', function(done){ 
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
                expect(res).to.have.status(401)
                done()
            })
        })

        //get postings
        it('Get all postings', function(done){
            chai.request(addr)
            .get('/postings')
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(200)
                done()
            })
        })
    })

    describe('GET, MODIFY and DELETE /postings/id endpoint', function(){
        //get posting by id
        it('Get posting with valid id and response with the status code 200', function(done){ 
            chai.request(addr)
            .get(`/postings/${id}`)
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(200)
                done()
            })
        })
        it('Get posting with id that not exist and response with the status code 404', function(done){ 
            chai.request(addr)
            .get(`/postings/invalid-id`)
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(404)
                done()
            })
        })
        //modify posting
        it('Modify posting with valid information and id and response with the status code 200', function(done){ 
            chai.request(addr)
            .put(`/postings/${id}`)
            .set({ "Authorization": `Bearer ${token}` })
            .send({
                title : "Modified Posting",
            })
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(200)
                done()
            })
        })
        it('Modify posting without authentication and response with the status code 401', function(done){ 
            chai.request(addr)
            .put(`/postings/${id}`)
            .send({
                title : "Modified Posting",
            })
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(401)
                done()
            })
        })
        it('Modify posting with id that not exist and response with the status code 404', function(done){ 
            chai.request(addr)
            .post('/postings/12341234')
            .send({
                title : "Modified Posting",
            })
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(404)
                done()
            })
        })
        //delete posting
        it('Delete posting with valid id and response with the status code 200', function(done){ 
            chai.request(addr)
            .delete(`/postings/${id}`)
            .set({ "Authorization": `Bearer ${token}` })
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(200)
                done()
            })
        })
        it('Delete posting without authentication and response with the status code 401', function(done){ 
            chai.request(addr)
            .delete(`/postings/${id}`)
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(401)
                done()
            })
        })
        it('Delete posting with id that not exist and response with the status code 404', function(done){ 
            chai.request(addr)
            .post('/postings/12341234')
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(404)
                done()
            })
        })
    })

    describe('GET /postings/ by category, location and date endpoint', function(){
        //category
        it('Get posting by category with valid category name and response with the status code 200', function(done){ 
            chai.request(addr)
            .get(`/postings/category/test-postings`)
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(200)
                done()
            })
        })
        it('Get posting with category that not exist and response with the status code 404', function(done){ 
            chai.request(addr)
            .get(`/postings/category/nonexistingcategory`)
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(404)
                done()
            })
        })
        //location
        it('Get posting by location with valid location name and response with the status code 200', function(done){ 
            chai.request(addr)
            .get(`/postings/location/earth`)
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(200)
                done()
            })
        })
        it('Get posting with location that not exist and response with the status code 404', function(done){ 
            chai.request(addr)
            .get(`/postings/location/new york`)
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(404)
                done()
            })
        })
        //date
        var today = new Date();
        var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
        it('Get posting by date with valid date name and response with the status code 200', function(done){ 
            chai.request(addr)
            .get(`/postings/date/${date}`)
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(200)
                done()
            })
        })
        it('Get posting with date that not exist and response with the status code 404', function(done){ 
            chai.request(addr)
            .get(`/postings/date/12.2.1234`)
            .end(function(err,res){
                expect(err).to.be.null
                expect(res).to.have.status(404)
                done()
            })
        })
    })
})



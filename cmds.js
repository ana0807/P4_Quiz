/**
 * Created by ana.martinez.martin on 1/03/18.
 */
const Sequelize = require('sequelize');

const {models} = require('./model');

const {log ,biglog,errorlog,colorize}=require('./out');

// Promesa auxiliar
const validateId = id => {

    return new Sequelize.Promise((resolve,reject)=>{
        if (typeof id === "undefined"){
        reject(new Error(`Falta el parametro<id>.`));
    }else{
        id = parseInt(id); // coge la parte entera y descarga lo demas
        if(Number.isNaN(id)){
            reject(new Error(`El valor del parámetro <id> no es un `))
        }else{
            resolve(id);
        }
    }
});
};

const makeQuestion = (rl, text) => {

    return new Sequelize.Promise((resolve,reject)=> {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};


exports.helpCmd=(socket,rl)=>{
    log(socket,"Comandos:");
    log(socket,"h|help - Muestra esta ayuda.");
    log(socket,"list - Listar los quizzes existentes.");
    log(socket,"show <id> - Muestra la pregunta y la respuesta del quiz indicado.");
    log(socket,"add - Añadir un nuevo quiz interactivamente." );
    log(socket,"delete<id> - Borrar el quiz indicado.");
    log(socket,"edit <id> - Editar el quiz indicado.");
    log(socket,"test <id> - Probar el quiz indicado.");
    log(socket,"p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log(socket,"credits - Créditos.");
    log(socket,"q|quit - Salir del programa.");
    rl.prompt();
};



exports.quitCmd=(socket,rl)=>{
    rl.close();
    socket.end();
};


exports.addCmd= (socket,rl) =>{
    makeQuestion(rl, 'Introduzca una pregunta: ')
        .then(q => {
            return makeQuestion(rl, 'Introduzca la respuesta')
                .then(a => {
                    return {question:q, answer:a};
            });
    })
    .then(quiz => {
        return models.quiz.create(quiz);

    })
    .then((quiz)=> {
        log(socket,`${colorize('Se ha añadido','magenta')}: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error =>{ //error de validacion
        errorlog(socket,'El quiz es erroneo: ');
        error.errors.forEach(({message})=> errorlog(socket,message));
    })
    .catch(error => { //cualquier otro tipo de error
        errorlog(socket,error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

exports.listCmd=(socket,rl)=>{

    models.quiz.findAll() //promesa
        .each(quiz => {
            log(socket,`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(()=>{
            rl.prompt();
    });
};



exports.showCmd=(socket,rl,id)=>{

    validateId(id)
        .then(id=> models.quiz.findById(id))
        .then(quiz=>{
            if(!quiz){
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
             log(socket,`[${colorize(quiz.id,'magenta')}]: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);
    })
    .catch(error => {
        errorlog(socket,error.message);
    })
    .then(()=> {
        rl.prompt();
    });

};

exports.testCmd = (socket,rl, id) => {

    validateId(id)
	.then(id => models.quiz.findById(id))
	.then (quiz => {
	    
		if (!quiz) {
			throw new Error(`No existe un quiz asociado al id=${id}.`)
		}
		return makeQuestion(rl, `${quiz.question}? `)
	    
            .then(a => {
                if (a.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
                    log(socket,"Su respuesta es correcta:");
                    biglog(socket,'CORRECTA', 'green');
			
                } else {
                    log(socket,"Su respuesta es incorrecta:");
                    biglog(socket,'INCORRECTA', 'red');
                }

               //rl.prompt();
            });
	})
	.catch(Sequelize.ValidationError, error => {
		errorlog(socket,'El quiz es erroneo: ');
		error.errors.forEach(({message}) => errorlog(socket,message));
	})
	.catch(error => {
		errorlog(socket,error.message);
	})
	.then (() => {
		rl.prompt();
	});
};






exports.deleteCmd=(socket,rl,id)=> {

    validateId(id)
    .then(id => models.quiz.destroy({where: {id}}))
    .catch(error => {
        errorlog(socket,error.message);
    })
    .then(() =>{
        rl.prompt();
    });

};


exports.editCmd=(socket,rl,id)=>{

    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz =>{
            if(!quiz){
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
            return makeQuestion(rl, 'Introduzca la pregunta: ')
                .then(q => {
                    process.stdout.isTTY && setTimeout(()=> {rl.write(quiz.answer)},0);
                    return makeQuestion(rl, 'Introduzca la respuesta')
                        .then(a =>{
                            quiz.question =q;
                            quiz.answer =a;
                            return quiz;
                    });

            });
    })
    .then(quiz =>{
        return quiz.save();
    })
    .then(quiz => {
        log(socket,`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>','magenta')} ${quiz.answer}`);

    })
    .catch(Sequelize.ValidationError, error =>  {
        errorlog(socket,'El quiz es erroneo: ');
        error.errors.forEach(({message}) => errorlog(socket,message));
    })
    .catch(error => {
        errorlog(socket,error.message);
    })
    .then(() => {
        rl.prompt();
    });

};


exports.playCmd = (socket,rl) => {

  		let score = 0;
  		let toBeResolved = [];
     		 for (i=0; i<models.quiz.count();i++){
        		toBeResolved[i]=i;
      }

  	const playOne = () => {
		
        return new Promise ((resolve, reject) => {
  		if(toBeResolved.length === 0) {
           		 log(socket,'No hay preguntas que responder','magenta');
           		 log(socket,' Fin del examen. Aciertos: ');
  					resolve();
  					return;
  		}
		
  	let pos = Math.floor(Math.random()*toBeResolved.length);
  	let quiz = toBeResolved[pos];
  	toBeResolved.splice(pos, 1); 

  	 makeQuestion(rl, quiz.question)
  		.then(answer => {
            		if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
              		
  				log(socket,`  CORRECTO - Lleva ${score++} aciertos`); // ¿++?
					score++;
  				       resolve(playOne());
           		 }else{
            		  log(socket,'  INCORRECTO ');
             		  log(socket,` Fin del juego. Aciertos: ${score} `);
  				  resolve();
  			    }
  		    })
  	     })
  	  }
  		models.quiz.findAll({raw: true}) 
  		.then(quizzes => {
  			toBeResolved= quizzes;
      })
  		.then(() => {
  		 	return playOne(); 
  		 })
  		.catch(e => {
  			errorlog(socket,"Error:" + e); 
  		})
  		.then(() => {
  			biglog(socket,score, 'blue');
  			rl.prompt();
  		})
}





exports.creditsCmd=(socket,rl)=>{
    log(socket,'Autores de la practica:','red');
    log(socket,'ANA','green');
    log(socket,'SELENE','green');
    rl.prompt();
};


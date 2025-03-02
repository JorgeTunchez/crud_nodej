const express = require('express');
const router = express.Router();
const User = require('../models/users');
const multer = require('multer');
const fs = require('fs');

// image upload
var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads')
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname)
    },
})

var upload = multer({
    storage: storage,
}).single("image");

// insert an user into database route
router.post('/add', upload, async (req, res) => {
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.file.filename,
        });

        await user.save(); // Guardar el usuario en la base de datos

        req.session.message = {
            type: 'success',
            message: 'Usuario registrado exitosamente!'
        };
        res.redirect("/");

    } catch (err) {
        res.json({
            message: err.message,
            type: "danger"
        });
    }
});

//edit an user route
router.get('/edit/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const user = await User.findById(id).exec(); // Buscar usuario por ID

        if (!user) {
            return res.redirect('/');
        }

        res.render('edit_users', {
            title: "Edit User",
            user: user,
        });

    } catch (err) {
        res.redirect('/');
    }
});

router.post('/update/:id', upload, async (req, res) => {
    try {
        let id = req.params.id;
        let new_image = '';

        // Manejo de la imagen
        if (req.file) {
            new_image = req.file.filename;
            try {
                fs.unlinkSync('./uploads/' + req.body.old_image); // Eliminar la imagen anterior
            } catch (error) {
                console.log(error);
            }
        } else {
            new_image = req.body.old_image;
        }

        // Actualizar usuario
        await User.findByIdAndUpdate(id, {
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: new_image,
        });

        // Mensaje de éxito en la sesión
        req.session.message = {
            type: 'success',
            message: 'Usuario Actualizado exitosamente'
        };

        res.redirect("/");

    } catch (err) {
        res.json({ message: err.message, type: 'danger' });
    }
});

//delete user route
router.get('/delete/:id', async (req, res) => {
    try {
        let id = req.params.id;
        const result = await User.findByIdAndDelete(id).exec(); // Eliminar usuario

        // Verificar si el usuario tenía una imagen y eliminarla
        if (result && result.image) {
            try {
                fs.unlinkSync('./uploads/' + result.image);
            } catch (error) {
                console.log(error);
            }
        }

        // Mensaje de éxito en la sesión
        req.session.message = {
            type: 'success',
            message: 'Usuario eliminado exitosamente'
        };

        res.redirect('/');

    } catch (err) {
        res.json({ message: err.message });
    }
});




// get all users route
router.get('/', async (req, res) => {
    try {
        const users = await User.find().exec(); // Obtener los usuarios de la BD

        res.render('index', {
            title: 'CRUD NODEJS',
            users: users,
        });

    } catch (err) {
        res.json({
            message: err.message
        });
    }
});



router.get('/add', (req, res) => {
    res.render('add_users', {title: "Add Users"});
});

module.exports = router;
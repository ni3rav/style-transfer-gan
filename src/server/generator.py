import functools

import torch.nn as nn


class Identity(nn.Module):
    def forward(self, x):
        return x


def get_norm_layer(norm_type="instance"):
    if norm_type == "batch":
        return functools.partial(nn.BatchNorm2d, affine=True, track_running_stats=True)
    if norm_type == "instance":
        return functools.partial(nn.InstanceNorm2d, affine=False, track_running_stats=False)
    if norm_type == "none":
        def norm_layer(x):
            return Identity()
        return norm_layer
    raise NotImplementedError(f"normalization layer [{norm_type}] is not found")


class ResnetBlock(nn.Module):
    def __init__(self, dim, padding_type, norm_layer, use_dropout, use_bias):
        super().__init__()
        self.conv_block = self.build_conv_block(dim, padding_type, norm_layer, use_dropout, use_bias)

    def build_conv_block(self, dim, padding_type, norm_layer, use_dropout, use_bias):
        block = []
        padding = 0
        if padding_type == "reflect":
            block += [nn.ReflectionPad2d(1)]
        elif padding_type == "replicate":
            block += [nn.ReplicationPad2d(1)]
        elif padding_type == "zero":
            padding = 1
        else:
            raise NotImplementedError(f"padding [{padding_type}] is not implemented")
        block += [nn.Conv2d(dim, dim, kernel_size=3, padding=padding, bias=use_bias), norm_layer(dim), nn.ReLU(True)]
        if use_dropout:
            block += [nn.Dropout(0.5)]
        padding = 0
        if padding_type == "reflect":
            block += [nn.ReflectionPad2d(1)]
        elif padding_type == "replicate":
            block += [nn.ReplicationPad2d(1)]
        elif padding_type == "zero":
            padding = 1
        else:
            raise NotImplementedError(f"padding [{padding_type}] is not implemented")
        block += [nn.Conv2d(dim, dim, kernel_size=3, padding=padding, bias=use_bias), norm_layer(dim)]
        return nn.Sequential(*block)

    def forward(self, x):
        return x + self.conv_block(x)


class ResnetGenerator(nn.Module):
    def __init__(self, input_nc, output_nc, ngf=64, norm_layer=nn.BatchNorm2d, use_dropout=False, n_blocks=9, padding_type="reflect"):
        assert n_blocks >= 0
        super().__init__()
        if isinstance(norm_layer, functools.partial):
            use_bias = norm_layer.func == nn.InstanceNorm2d
        else:
            use_bias = norm_layer == nn.InstanceNorm2d
        model = [
            nn.ReflectionPad2d(3),
            nn.Conv2d(input_nc, ngf, kernel_size=7, padding=0, bias=use_bias),
            norm_layer(ngf),
            nn.ReLU(True),
        ]
        n_downsampling = 2
        for i in range(n_downsampling):
            mult = 2**i
            model += [
                nn.Conv2d(ngf * mult, ngf * mult * 2, kernel_size=3, stride=2, padding=1, bias=use_bias),
                norm_layer(ngf * mult * 2),
                nn.ReLU(True),
            ]
        mult = 2**n_downsampling
        for _ in range(n_blocks):
            model += [ResnetBlock(ngf * mult, padding_type=padding_type, norm_layer=norm_layer, use_dropout=use_dropout, use_bias=use_bias)]
        for i in range(n_downsampling):
            mult = 2 ** (n_downsampling - i)
            model += [
                nn.ConvTranspose2d(ngf * mult, int(ngf * mult / 2), kernel_size=3, stride=2, padding=1, output_padding=1, bias=use_bias),
                norm_layer(int(ngf * mult / 2)),
                nn.ReLU(True),
            ]
        model += [nn.ReflectionPad2d(3), nn.Conv2d(ngf, output_nc, kernel_size=7, padding=0), nn.Tanh()]
        self.model = nn.Sequential(*model)

    def forward(self, x):
        return self.model(x)


def define_G(input_nc, output_nc, ngf, netG, norm="instance", use_dropout=False):
    norm_layer = get_norm_layer(norm)
    if netG == "resnet_9blocks":
        return ResnetGenerator(input_nc, output_nc, ngf, norm_layer=norm_layer, use_dropout=use_dropout, n_blocks=9)
    raise NotImplementedError(f"Generator model name [{netG}] is not recognized")
